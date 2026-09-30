# Claude agent on the Mac mini: setup and use

About 15 minutes, once. After that you can text the Mac mini (or use the control panel's **Ask Claude** tab) to ask about your apps or have them changed. It uses your own Claude subscription: nothing extra to pay.

**What it does**
- **Answers questions**: "Is everything running?", "Why was the shop down last night?", "How do I add someone to the Farm Log?"
- **Makes changes you ask for**, after checking with you: it texts back a short plan and waits for your **yes**. Nothing changes until you say yes.
- **Fixes outages by itself**: if the watchdog restarts an app and it's still down, Claude looks into it, fixes it if it safely can, and texts you what it did.
- **Undoes its own mistakes**: after any change, the Mac checks every app still works. If one doesn't, the change is undone automatically and you're told.

**Before you start**
- The watchdog is on and texting you ([APP-HUB-SETUP.md](APP-HUB-SETUP.md)). The agent texts from the same Messages account.
- Your Claude account (Pro works; Max gives it more room).

---

## 1. Get the latest version

If nightly updates are on, you already have it. Otherwise, in **Terminal** on the Mac mini:

```bash
cd ~/Farm-event-tracker
git pull
```

## 2. Run the setup

```bash
bash scripts/mac/enable-agent.sh
```

It walks you through five steps:

1. **Checks the Mac.** If Claude Code isn't installed, it installs it with Anthropic's official installer.
2. **Signs in to Claude.** A browser opens: sign in with your Claude account and approve. Terminal then shows a long token starting with `sk-ant-`. Copy it and paste it when asked. It's stored only on the Mac mini, readable only by your user.
3. **Who can text it.** Texts from your alerts number are accepted; add your Apple ID email too if your iPhone sometimes sends iMessages from it. Texts from anyone else are ignored.
4. **Lets the Mac read texts sent to it.** macOS keeps Messages private, so you allow one small built-in tool, `sqlite3`, in **System Settings → Privacy & Security → Full Disk Access**: click **+**, press **Command-Shift-G**, type `/usr/bin/sqlite3`, press Return, click **Open**, and make sure its switch is on. The script checks it worked.
5. **Starts the agent** and texts you. Reply "Are the apps OK?" to try it.

If step 4 doesn't work, you can skip it: the control panel's Ask Claude tab still works, just not texting.

---

## Using it

- **Text the Mac mini** (the same conversation your alerts come in), or type in the control panel's **Ask Claude** tab. Both are the same conversation.
- **Asking for a change**: describe it in your own words ("add a pickup date to shop orders", "make the farm's buttons dark green"). Claude replies with a plan. Reply **yes** to go ahead, or **no** (or tell it what to change). While it works you'll get "On it", then a summary when it's done.
- **Start fresh**: text **start over** to begin a new conversation. It also starts fresh by itself after 8 quiet hours.
- **Daily limit**: to protect your Claude plan, it does up to 25 jobs a day (each question or change is one). If your Pro plan's own usage limit is reached, it tells you and is ready again a few hours later.
- For quick things like colors and list entries, the control panel's Look and Lists tabs are faster, and Claude will often point you there.

## Safety

- It only answers texts from your own numbers, and the control panel needs your password.
- When answering questions it can look but not change anything. It can only change things after your yes, or to fix an outage.
- It never touches app data or backups, and every change is saved as a version that can be undone.
- Its changes are uploaded to GitHub like any other update, so you (or Claude in the Claude app) can review them later.

## Day-to-day

| To… | Do this |
|---|---|
| See if it's running and what it did | `bash scripts/mac/enable-agent.sh --status` |
| Full history | `~/AppHub/logs/agent.log` |
| Sign in to Claude again (if it says it can't) | `bash scripts/mac/enable-agent.sh --token` |
| Change the daily limit | Edit `DAILY_LIMIT` in `~/AppHub/agent/agent.conf` |
| Turn it off | `bash scripts/mac/enable-agent.sh --off` |
