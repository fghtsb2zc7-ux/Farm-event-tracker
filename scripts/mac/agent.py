#!/usr/bin/env python3
"""The Claude agent on the Mac mini (turned on by enable-agent.sh, runs in the background while you're logged in).

It picks up, one at a time:
  - texts you send the Mac mini (read from Messages by a small helper job, see enable-agent.sh)
  - messages typed in the control panel's "Ask Claude" tab
  - outages the watchdog couldn't fix by restarting (~/AppHub/agent/escalations/)
and runs Claude Code in the project folder to answer, then replies the same way the message came in.

Claude can look at anything but changes nothing unless you said yes to its plan, except to fix an outage.
After any change, this checks every app that was running still answers, and undoes the change if one doesn't.

Settings: ~/AppHub/agent/agent.conf. History: ~/AppHub/logs/agent.log.
Standard library only, so it runs on the Python that comes with macOS's developer tools.
"""
import datetime
import fcntl
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request

REPO = os.environ.get("AGENT_REPO") or os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HUB = os.environ.get("HUB_DIR") or os.path.expanduser("~/AppHub")
AG = os.path.join(HUB, "agent")
LOG = os.path.join(HUB, "logs", "agent.log")
HUB_URL = os.environ.get("AGENT_HUB_URL", "http://127.0.0.1:8092")
POLL = float(os.environ.get("AGENT_POLL", "4"))
RUN_TIMEOUT = 20 * 60          # longest a single Claude run may take
NEW_SESSION_AFTER = 8 * 3600   # a quiet gap this long starts a fresh conversation
ESCALATE_EVERY = 6 * 3600      # at most one outage investigation per problem in this time

YES = re.compile(r"^\s*(y|yes|yep|yeah|yup|ok|okay|sure|go|go ahead|do it|approved?|sounds good|please do|👍)\b", re.I)
RESET = re.compile(r"^\s*(new chat|start over|reset)\s*[.!]*\s*$", re.I)
MARKER = "[[NEEDS_YES]]"

# Tools Claude may use when answering: look, don't touch.
TALK_TOOLS = [
    "Read", "Glob", "Grep", "WebSearch", "WebFetch",
    "Bash(bash scripts/mac/watchdog.sh --status)", "Bash(bash scripts/mac/check-online.sh)",
    "Bash(tail:*)", "Bash(head:*)", "Bash(cat:*)", "Bash(ls:*)", "Bash(grep:*)", "Bash(wc:*)",
    "Bash(git log:*)", "Bash(git status:*)", "Bash(git diff:*)", "Bash(git show:*)",
    "Bash(curl -s http://127.0.0.1:*)", "Bash(curl -fs http://127.0.0.1:*)",
    "Bash(df:*)", "Bash(uptime)", "Bash(date)", "Bash(launchctl print:*)", "Bash(pmset -g:*)",
]
# Tools for an approved change or an outage fix.
WORK_TOOLS = ["Read", "Edit", "Write", "Glob", "Grep", "Bash", "WebSearch", "WebFetch"]
NEVER = ["Bash(rm -rf:*)", "Bash(sudo rm:*)", "Bash(git push --force:*)", "Bash(git push -f:*)", "Bash(git reset --hard origin:*)"]


def log(msg):
    os.makedirs(os.path.dirname(LOG), exist_ok=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(f"{datetime.datetime.now():%Y-%m-%d %H:%M:%S}  {msg}\n")


def read_conf(path):
    out = {}
    try:
        with open(path, encoding="utf-8") as f:
            for line in f:
                m = re.match(r'^\s*([A-Z_]+)="?(.*?)"?\s*$', line)
                if m:
                    out[m.group(1)] = m.group(2)
    except FileNotFoundError:
        pass
    return out


def load_json(path, default):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, ValueError):
        return default


def save_json(path, obj):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2)
    os.replace(tmp, path)


class Agent:
    def __init__(self):
        os.makedirs(os.path.join(AG, "escalations"), exist_ok=True)
        self.state_path = os.path.join(AG, "state.json")
        self.st = load_json(self.state_path, {})
        self.queue = []
        self.conf = {}
        self.busy = False

    # ---- settings and bookkeeping ----
    def save(self):
        save_json(self.state_path, self.st)

    def load_conf(self):
        self.conf = read_conf(os.path.join(AG, "agent.conf"))
        self.limit = int(self.conf.get("DAILY_LIMIT") or 25)
        self.handles = {h.strip().lower() for h in (self.conf.get("HANDLES") or "").split(",") if h.strip()}

    def runs_today(self):
        today = datetime.date.today().isoformat()
        if self.st.get("day") != today:
            self.st["day"], self.st["runs"] = today, 0
        return self.st.get("runs", 0)

    def heartbeat(self, note=""):
        save_json(os.path.join(AG, "status.json"), {
            "updated": int(time.time()), "busy": self.busy, "waitingForYes": bool(self.st.get("waitingForYes")),
            "runsToday": self.runs_today(), "dailyLimit": self.limit, "note": note,
        })

    # ---- the control panel ----
    def hub(self, method, path, body=None):
        try:
            with open(os.path.join(HUB, "hub.key"), encoding="utf-8") as f:
                key = f.read().strip()
        except FileNotFoundError:
            return None
        req = urllib.request.Request(HUB_URL + path, method=method, data=json.dumps(body).encode() if body is not None else None,
                                     headers={"X-Hub-Key": key, "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                return json.load(r)
        except (urllib.error.URLError, OSError, ValueError):
            return None  # the control panel isn't running; texting still works without it

    # ---- texts ----
    def text_owner(self, msg):
        r = subprocess.run(["bash", os.path.join(REPO, "scripts", "mac", "notify.sh"), plain(msg)], capture_output=True, text=True)
        if r.returncode != 0:
            log(f"Couldn't send a text: {(r.stdout + r.stderr).strip()[:300]}")

    def read_texts(self):
        """New texts from the owner, from the helper job's output (~/AppHub/agent/imessage.out)."""
        path = os.path.join(AG, "imessage.out")
        try:
            with open(path, encoding="utf-8", errors="replace") as f:
                raw = f.read()
            open(path, "w").close()
        except FileNotFoundError:
            return []
        rows, dec, i = [], json.JSONDecoder(), 0
        while True:  # the helper appends one JSON list per run
            while i < len(raw) and raw[i] in " \r\n\t":
                i += 1
            if i >= len(raw):
                break
            try:
                obj, i = dec.raw_decode(raw, i)
            except ValueError:
                break
            if isinstance(obj, list):
                rows += obj
        first = "watermark" not in self.st  # first start: don't answer old messages
        mark = self.st.get("watermark", 0)
        out = []
        for r in sorted(rows, key=lambda r: int(r.get("id") or 0)):
            rid = int(r.get("id") or 0)
            if rid <= mark:
                continue
            mark = rid
            if first or str(r.get("sender", "")).lower() not in self.handles:
                continue
            text = (r.get("text") or decode_body(r.get("body")) or "").strip()
            if text:
                out.append(text)
        if mark != self.st.get("watermark") or first:
            self.st["watermark"] = mark
            self.save()
        return out

    # ---- what to do next ----
    def next_item(self):
        if self.queue:
            return self.queue.pop(0)
        edir = os.path.join(AG, "escalations")
        for name in sorted(os.listdir(edir)):
            path = os.path.join(edir, name)
            e = load_json(path, None)
            os.remove(path)
            if not e:
                continue
            key = name.rsplit(".", 1)[0]
            last = self.st.setdefault("escalated", {}).get(key, 0)
            if time.time() - last < ESCALATE_EVERY:
                log(f"Skipped looking into {key} again (already did in the last 6 hours).")
                continue
            self.st["escalated"][key] = int(time.time())
            self.save()
            return {"source": "watchdog", "text": e.get("text", ""), "esc": e}
        texts = self.read_texts()
        if texts:  # a burst of texts is one message
            return {"source": "imessage", "text": "\n".join(texts)}
        m = (self.hub("GET", "/api/hub/agent/runner/next") or {}).get("message")
        if m:
            return {"source": "panel", "text": m["text"], "id": m["id"]}
        return None

    def reply(self, item, text, role="claude"):
        if item["source"] == "panel":
            self.hub("POST", "/api/hub/agent/runner/post", {"doneId": item.get("id"), "text": text, "role": role, "source": "panel"})
        else:
            self.text_owner(text)
            self.hub("POST", "/api/hub/agent/runner/post", {"text": text, "role": role, "source": "imessage"})

    def handle(self, item):
        src, text = item["source"], item["text"]
        log(f"From {src}: {text[:200]}")
        if src == "imessage":
            self.hub("POST", "/api/hub/agent/runner/post", {"text": text, "role": "you", "source": "imessage"})
        if RESET.match(text):
            self.st.pop("session", None)
            self.st["waitingForYes"] = False
            self.save()
            return self.reply(item, "OK, I've started a fresh conversation.")
        if self.runs_today() >= self.limit:
            return self.reply(item, f"I've already done my {self.limit} jobs for today, which keeps your Claude plan from running out. "
                                    "I'll be ready again tomorrow. Anything urgent can be done in the Claude app.")

        mode = "talk"
        if src == "watchdog":
            mode = "fix"
        elif self.st.get("waitingForYes"):
            self.st["waitingForYes"] = False
            self.save()
            if YES.match(text):
                mode = "work"
        now = datetime.datetime.now().strftime("%A %B %-d, %-I:%M %p")
        if mode == "talk":
            how = "by text message" if src == "imessage" else "in the control panel"
            prompt = f"[Answering mode. {now}. The owner wrote {how}:]\n{text}"
        elif mode == "work":
            prompt = (f"[Making an approved change. {now}. The owner replied:]\n{text}\n\n"
                      "[That approves the plan you proposed. Carry it out now, following the rules for making changes, "
                      "then reply with a short summary for the owner.]")
        else:
            e = item["esc"]
            prompt = (f"[Fixing an outage. {now}. The watchdog reports:] {e.get('text')}\n"
                      f"[App: {e.get('name')} (id {e.get('app')}). Its log: {e.get('log')}. The watchdog already restarted it. "
                      "Find out why and fix it if you safely can, following the rules. Then write a short text for the owner: "
                      "what was wrong, what you did, and whether it's working now.]")
            self.hub("POST", "/api/hub/agent/runner/post", {"text": f"Watchdog: {e.get('text')} Claude is looking into it.", "role": "note", "source": "watchdog"})

        if mode != "talk" and src == "imessage":
            self.text_owner("On it. I'll text you when it's done.")
        before = self.snapshot() if mode != "talk" else None
        self.busy = True
        self.heartbeat()
        try:
            answer = self.run_claude(mode, prompt)
        finally:
            self.busy = False
        if before is not None:
            answer += self.check_after(before, self.st.get("request", text) if mode == "work" else "outage fix")
        if MARKER in answer:
            answer = answer.replace(MARKER, "").strip() + "\n\nReply yes to go ahead, or no."
            self.st["waitingForYes"] = mode == "talk"
            self.st["request"] = text  # names the change when it's saved
            self.save()
        self.reply(item, answer.strip() or "Done.")
        log(f"Replied ({mode}): {answer[:300]}")

    # ---- running Claude ----
    def run_claude(self, mode, prompt):
        claude = self.conf.get("CLAUDE_BIN") or "claude"
        with open(os.path.join(REPO, "scripts", "mac", "agent-prompt.md"), encoding="utf-8") as f:
            system = f.read()
        tools = TALK_TOOLS if mode == "talk" else WORK_TOOLS
        cmd = [claude, "-p", "--output-format", "json", "--append-system-prompt", system,
               "--permission-mode", "dontAsk", "--allowedTools", ",".join(tools), "--disallowedTools", ",".join(NEVER),
               "--add-dir", HUB]
        if self.conf.get("MODEL"):
            cmd += ["--model", self.conf["MODEL"]]
        if self.st.get("session") and time.time() - self.st.get("sessionUsed", 0) < NEW_SESSION_AFTER:
            cmd += ["--resume", self.st["session"]]
        env = dict(os.environ)
        try:
            with open(os.path.join(AG, "claude-token"), encoding="utf-8") as f:
                env["CLAUDE_CODE_OAUTH_TOKEN"] = f.read().strip()
        except FileNotFoundError:
            pass
        env["PATH"] = ":".join([os.path.expanduser("~/.local/bin"), "/opt/homebrew/bin", "/usr/local/bin", env.get("PATH", "/usr/bin:/bin")])
        custom = os.environ.get("AGENT_CLAUDE_CMD")  # for testing
        if custom:
            cmd = [custom] + cmd[1:]
        self.st["runs"] = self.runs_today() + 1
        self.save()
        log(f"Running Claude ({mode}).")
        try:
            r = subprocess.run(cmd, input=prompt, cwd=REPO, env=env, capture_output=True, text=True, timeout=RUN_TIMEOUT)
        except subprocess.TimeoutExpired:
            return "That took too long, so I stopped. Try asking again in a simpler way, or in smaller steps."
        except FileNotFoundError:
            return "Claude Code isn't installed where I expected it on the Mac mini. Run: bash scripts/mac/enable-agent.sh"
        try:
            out = json.loads(r.stdout)
        except ValueError:
            log(f"Claude didn't answer properly (exit {r.returncode}): {(r.stderr or r.stdout)[:500]}")
            return "Something went wrong running Claude on the Mac mini. The details are in ~/AppHub/logs/agent.log."
        if out.get("session_id"):
            self.st["session"], self.st["sessionUsed"] = out["session_id"], int(time.time())
            self.save()
        result = str(out.get("result") or "")
        if out.get("is_error"):
            log(f"Claude reported a problem: {result[:500]}")
            if re.search(r"usage limit|rate limit|limit reached", result, re.I):
                return "I've hit the usage limit on your Claude Pro plan for now. It resets within a few hours; ask me again then."
            if re.search(r"auth|token|login|401", result, re.I):
                return "I can't sign in to Claude any more. On the Mac mini, run: bash scripts/mac/enable-agent.sh --token"
            return result or "Claude ran into a problem. The details are in ~/AppHub/logs/agent.log."
        return result

    # ---- safety net after a change ----
    def git(self, *args):
        return subprocess.run(["git", *args], cwd=REPO, capture_output=True, text=True)

    def apps(self):
        try:
            with open(os.path.join(REPO, "scripts", "mac", "apps.sh"), encoding="utf-8") as f:
                src = f.read()
        except FileNotFoundError:
            return []
        return [{"id": m[0], "name": m[1], "label": m[2], "port": int(m[3])}
                for m in re.findall(r'(\w+)\)\s*APP=\w+;\s*APP_NAME="([^"]+)";\s*LABEL="([^"]+)";\s*PORT=(\d+)', src)]

    @staticmethod
    def healthy(port):
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/health", timeout=3) as r:
                return r.status == 200
        except (urllib.error.URLError, OSError):
            return False

    def restart(self, app):
        custom = os.environ.get("HUB_RESTART_CMD")
        cmd = [custom, app["label"]] if custom else ["sudo", "-n", "/bin/launchctl", "kickstart", "-k", "system/" + app["label"]]
        try:
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=30)
        except (subprocess.TimeoutExpired, OSError) as err:
            log(f"Couldn't restart {app['name']}: {err!r}")

    def snapshot(self):
        # Edits made by hand on this Mac are set aside (not lost: `git stash list`), so they don't get mixed into Claude's change.
        if self.git("status", "--porcelain").stdout.strip():
            self.git("stash", "push", "-u", "-q", "-m", "Set aside by the Claude agent before a change")
            log("Set aside hand edits in the project folder before making a change (see: git stash list).")
        self.git("pull", "--ff-only", "--quiet")
        head = self.git("rev-parse", "HEAD").stdout.strip()
        return {"head": head, "up": [a for a in self.apps() if self.healthy(a["port"])]}

    def wait_up(self, apps, seconds):
        for _ in range(seconds):
            down = [a for a in apps if not self.healthy(a["port"])]
            if not down:
                return []
            time.sleep(1)
        return down

    def check_after(self, before, what):
        """Every app that was running before must still answer; otherwise undo the change."""
        wait = int(os.environ.get("AGENT_WAIT", "60"))
        dirty = bool(self.git("status", "--porcelain").stdout.strip())
        head = self.git("rev-parse", "HEAD").stdout.strip()
        down = self.wait_up(before["up"], wait)
        for a in down:
            self.restart(a)
        if down:
            down = self.wait_up(down, wait)
        if not down:
            if dirty:  # Claude left changes uncommitted: save and share them
                self.git("add", "-A")
                self.git("commit", "-q", "-m", f"Claude agent: {what[:60]}")
                head = self.git("rev-parse", "HEAD").stdout.strip()
            if head != before["head"]:
                p = self.git("push", "--quiet")
                if p.returncode != 0:
                    log(f"git push failed: {p.stderr.strip()[:300]}")
                    return "\n\n(The change is saved on the Mac mini, but I couldn't upload it to GitHub. It still works.)"
            return ""
        names = ", ".join(a["name"] for a in down)
        log(f"Undoing the change: {names} stopped answering.")
        if dirty:
            self.git("stash", "push", "-u", "-q", "-m", "Claude agent: undone change")
        if head != before["head"]:
            r = self.git("revert", "--no-edit", f"{before['head']}..HEAD")
            if r.returncode != 0:
                self.git("revert", "--abort")
                self.git("reset", "--hard", "-q", before["head"])
            else:
                self.git("push", "--quiet")
        for a in down:
            self.restart(a)
        still = self.wait_up(down, wait)
        if still:
            return (f"\n\nImportant: after that change, {names} stopped answering. I undid the change, but it still isn't answering. "
                    "The watchdog will keep trying to restart it.")
        return f"\n\nImportant: after that change, {names} stopped answering, so I undid the change. Everything is back to how it was."

    # ---- main loop ----
    def run(self, once=False):
        log("Agent started.")
        while True:
            self.load_conf()
            self.heartbeat()
            item = self.next_item()
            if item:
                try:
                    self.handle(item)
                except Exception as err:  # keep going: one bad message mustn't stop the agent
                    log(f"ERROR handling a message: {err!r}")
                    self.busy = False
                    try:
                        self.reply(item, "Sorry, something went wrong on the Mac mini while handling that. The details are in ~/AppHub/logs/agent.log.")
                    except Exception:
                        pass
                continue
            if once:
                return
            time.sleep(POLL)


def plain(text):
    """Messages shows Markdown as-is, so texts drop it: **bold** and `code` marks, # headings, - bullets become •."""
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"^#+\s*", "", text, flags=re.M)
    return re.sub(r"^[ \t]*[-*][ \t]+", "• ", text, flags=re.M)


def decode_body(hexbody):
    """Newer macOS keeps a text's words in 'attributedBody' (an archived NSAttributedString) instead of 'text'."""
    if not hexbody:
        return None
    try:
        b = bytes.fromhex(hexbody)
    except ValueError:
        return None
    i = b.find(b"NSString")
    if i < 0:
        return None
    b = b[i + 8:]
    j = b.find(b"\x01+")
    if j < 0:
        return None
    b = b[j + 2:]
    if not b:
        return None
    n, start = b[0], 1
    if n == 0x81:
        n, start = int.from_bytes(b[1:3], "little"), 3
    elif n == 0x82:
        n, start = int.from_bytes(b[1:4], "little"), 4
    return b[start:start + n].decode("utf-8", "replace")


if __name__ == "__main__":
    os.makedirs(AG, exist_ok=True)
    lock = open(os.path.join(AG, "agent.lock"), "w")
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        print("The agent is already running.")
        sys.exit(0)
    Agent().run(once="--once" in sys.argv)
