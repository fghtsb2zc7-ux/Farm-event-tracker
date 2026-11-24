"""Offline test: fake feeds and a fake mailbox, build one issue, check the outputs."""
import email
import email.policy
import json
import os
import sys
import zipfile
from datetime import datetime, timezone
from email.utils import format_datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def long_text(tag, n=400):
    return "<p>" + " ".join(f"{tag}word{i}" for i in range(n)) + ".</p>"


def make_msg(frm, subject, html=None, text=None):
    m = email.message.EmailMessage(policy=email.policy.default)
    m["From"], m["Subject"] = frm, subject
    m["Date"] = format_datetime(datetime.now(timezone.utc))
    m["Message-ID"] = f"<{abs(hash(subject))}@test>"
    if html:
        m.set_content("plain")
        m.add_alternative(html, subtype="html")
    else:
        m.set_content(text)
    return m


def test_build_issue(tmp_path, monkeypatch):
    data = tmp_path / "data"
    data.mkdir()
    (data / "sources.json").write_text((ROOT / "config" / "sources.json").read_text())
    monkeypatch.setenv("PAPER_DATA", str(data))
    monkeypatch.setenv("UPSTREAM_DIR", str(ROOT / "upstream" / "scripts"))
    monkeypatch.setenv("KOBO_PAPER_CONFIG", str(ROOT / "app" / "kobo-config.json"))
    monkeypatch.setenv("FEED_404MEDIA", "https://feed.test/404")
    monkeypatch.setenv("SAVE_FROM", "me@example.com")
    sys.path.insert(0, str(ROOT / "app"))
    import importlib
    import paper
    importlib.reload(paper)

    now = format_datetime(datetime.now(timezone.utc))
    feed_404 = f"""<?xml version="1.0"?><rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel>
      <item><title>Full text 404 story</title><link>https://www.404media.co/a</link><pubDate>{now}</pubDate>
      <content:encoded><![CDATA[{long_text('f404')}]]></content:encoded></item></channel></rss>"""
    empty = '<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>'

    class R:
        def __init__(self, body): self.content, self.status_code = body.encode(), 200
        def raise_for_status(self): pass

    def fake_get(url, **kw):
        return R(feed_404 if "feed.test" in url else empty)

    monkeypatch.setattr(paper.requests, "get", fake_get)
    msgs = [
        make_msg("FT <newsletters@ft.com>", "FirstFT: markets rally",
                 f"<html><body><article><h1>FirstFT</h1>{long_text('ft')}</article></body></html>"),
        make_msg("The Economist <newsletters@e.economist.com>", "The world in brief",
                 f"<html><body><article>{long_text('eco')}<script>alert(1)</script></article></body></html>"),
        make_msg("Writer <writer@substack.com>", "A substack essay",
                 f"<html><body><div><a href='https://x.substack.com/p/e'>View in browser</a></div><article>{long_text('sub')}</article></body></html>"),
        make_msg("Stranger <x@evil.test>", "save this", text="https://evil.test/x"),
    ]

    class FakeImap:
        def logout(self): pass

    monkeypatch.setattr(paper, "imap_connect", lambda: FakeImap())
    monkeypatch.setattr(paper, "fetch_emails", lambda m, folder, since_days=2: msgs)
    sent = []
    monkeypatch.setattr(paper, "ntfy", lambda *a, **k: sent.append(("ntfy", a)))
    monkeypatch.setattr(paper, "send_email", lambda *a: sent.append(("email", a)))

    assert paper.cmd_build() == 0
    site = data / "site"
    issue = next(p for p in site.iterdir() if p.is_dir())
    meta = json.loads((issue / "edition.json").read_text())
    assert len(meta["titles"]) == 4
    assert meta["sources"] == ["Financial Times", "The Economist", "404 Media", "Substack"]
    page = (issue / "index.html").read_text()
    assert "<script" not in page and "Open in Books" in page
    epub = issue / meta["epub"]
    assert zipfile.is_zipfile(epub)
    assert (site / "index.html").exists()

    assert paper.cmd_deliver() == 0
    assert [s[0] for s in sent] == ["ntfy", "email"]
    # second build the same day picks nothing new and fails cleanly
    assert paper.cmd_build() == 1
