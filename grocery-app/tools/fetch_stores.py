#!/usr/bin/env python3
"""Stage 2: download ONE store-list file per chain, parse into data/stores.sqlite, print a coverage report.

Polite by design: one file per chain, 2 s pause between requests, honest User-Agent.
Run:  python3 tools/fetch_stores.py                       (Shufersal only: no login)
      python3 tools/fetch_stores.py --allow-public-logins (also the shared-server chains)
"""
import argparse, html, http.cookiejar, json, os, re, sqlite3, sys, time, urllib.parse, urllib.request
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from chains import CHAINS
from stores import parse_stores

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW, DB = os.path.join(ROOT, "data", "raw", "stores"), os.path.join(ROOT, "data", "stores.sqlite")
UA = "MethodPlay-grocery-experiment/0.1 (personal non-commercial project)"
PAUSE = 2.0
SHUFERSAL_LIST = "https://prices.shufersal.co.il/FileObject/UpdateCategory?catID=5&storeId=0&sort=Time&sortdir=Desc&page=1"
CERBERUS = "https://url.retail.publishedprices.co.il"

def get(opener, url, data=None, timeout=60):
    req = urllib.request.Request(url, data=data, headers={"User-Agent": UA})
    with opener.open(req, timeout=timeout) as r:
        return r.read()

def fetch_shufersal(opener):
    page = get(opener, SHUFERSAL_LIST).decode("utf-8", "replace")
    links = [html.unescape(h) for h in re.findall(r'href="([^"]+Stores[^"]*)"', page)]
    if not links:
        raise RuntimeError("no Stores link found on the Shufersal page (layout changed?)")
    time.sleep(PAUSE)
    return get(opener, links[0])

DEBUG = False

def find_token(page):
    """The server puts a security token (CSRF) in a <meta> tag; attribute order varies."""
    for pat in (r'name="csrftoken"[^>]*content="([^"]+)"', r'content="([^"]+)"[^>]*name="csrftoken"',
                r'name="csrftoken"[^>]*value="([^"]+)"', r'value="([^"]+)"[^>]*name="csrftoken"'):
        m = re.search(pat, page)
        if m: return m.group(1)
    return ""

def inspect_login(opener, user):
    """Print what the login page asks for and what the server answers. Makes the same requests as a normal login."""
    req = urllib.request.Request(CERBERUS + "/login", headers={"User-Agent": UA})
    with opener.open(req, timeout=60) as r: page = r.read().decode("utf-8", "replace")
    form = re.search(r"<form.*?</form>", page, re.S | re.I)
    print(f"--- {user}: login page form ---")
    print(re.sub(r'(content|value)="[A-Za-z0-9+/=_-]{20,}"', r'\1="<token>"', form.group(0) if form else page[:800])[:1500])
    token = find_token(page)
    body = urllib.parse.urlencode({"username": user, "password": "", "Submit": "Sign in", "csrftoken": token}).encode()
    req = urllib.request.Request(CERBERUS + "/login/user", data=body, headers={"User-Agent": UA})
    try:
        with opener.open(req, timeout=60) as r:
            text = r.read().decode("utf-8", "replace")
            print(f"--- {user}: login answer: status {r.status}, ended at {r.geturl()}")
    except urllib.error.HTTPError as e:
        text = e.read().decode("utf-8", "replace"); print(f"--- {user}: login answer: HTTP {e.code}")
    print("text:", re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", text))[:300])
    print("cookies:", [c.name for c in opener.handlers[-1].cookiejar] if hasattr(opener.handlers[-1], "cookiejar") else "?")

def fetch_cerberus(opener, user):
    login = get(opener, CERBERUS + "/login").decode("utf-8", "replace")
    token = find_token(login)
    body = urllib.parse.urlencode({"username": user, "password": "", "Submit": "Sign in", "csrftoken": token}).encode()
    after = get(opener, CERBERUS + "/login/user", body).decode("utf-8", "replace"); time.sleep(PAUSE)
    # The server issues a NEW token after login: read it from a page we are now allowed to see.
    page = get(opener, CERBERUS + "/file").decode("utf-8", "replace")
    if DEBUG:
        print(f"  [debug {user}] login token: {bool(token)} | login reply starts: {after[:120]!r}")
        has_form = 'type="password"' in page
        print(f"  [debug {user}] /file page has login form: {has_form} | new token found: {bool(find_token(page))}")
    if 'type="password"' in page:
        raise RuntimeError("login did not work (server showed the login form again; username may be wrong)")
    token = find_token(page) or token
    time.sleep(PAUSE)
    body = urllib.parse.urlencode({"sEcho": 1, "iColumns": 5, "iDisplayStart": 0, "iDisplayLength": 100000,
                                   "sSearch": "", "iSortingCols": 0, "cd": "/", "csrftoken": token}).encode()
    reply = get(opener, CERBERUS + "/file/json/dir", body)
    if DEBUG:
        print(f"  [debug {user}] list reply starts: {reply[:200]!r}")
    try:
        listing = json.loads(reply)
    except ValueError:
        raise RuntimeError("file list reply was not JSON: " + reply[:80].decode("utf-8", "replace"))
    rows = listing.get("aaData", [])
    if DEBUG:
        print(f"  [debug {user}] {len(rows)} entries; keys of first: {list(rows[0]) if rows else None}")
        print(f"  [debug {user}] first 12 names: {[r.get('fname') or r.get('name') for r in rows[:12]]}")
    for f in rows:  # tolerate either key name
        f.setdefault("fname", f.get("name", ""))
    files = [f for f in rows if re.search(r"store", f.get("fname", ""), re.I)]
    if not files:
        raise RuntimeError(f"list worked ({len(rows)} entries) but none has 'store' in its name; reply: {str(listing)[:100]}")
    newest = max(files, key=lambda f: f.get("time", ""))
    time.sleep(PAUSE)
    return get(opener, CERBERUS + "/file/d/" + urllib.parse.quote(newest["fname"])), newest["fname"]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--allow-public-logins", action="store_true")
    ap.add_argument("--debug", action="store_true", help="print what the server really sends")
    ap.add_argument("--inspect-login", action="store_true", help="show login form fields and the server's answer")
    ap.add_argument("--only", help="comma-separated chain keys")
    a = ap.parse_args()
    global DEBUG; DEBUG = a.debug
    os.makedirs(RAW, exist_ok=True)
    db = sqlite3.connect(DB)
    db.execute("""CREATE TABLE IF NOT EXISTS branches(chain TEXT, branch_id TEXT, name TEXT, address TEXT,
                  city TEXT, fetched TEXT, PRIMARY KEY(chain, branch_id))""")
    report = []
    for key, (name, kind, user) in CHAINS.items():
        if a.only and key not in a.only.split(","): continue
        if kind == "cerberus" and not a.allow_public_logins:
            report.append((key, name, "SKIPPED", "needs the shared server's public login (use --allow-public-logins)")); continue
        try:
            opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
            if a.inspect_login:
                if kind == "cerberus": inspect_login(opener, user)
                continue
            if kind == "shufersal": raw, fname = fetch_shufersal(opener), "Stores"
            else: raw, fname = fetch_cerberus(opener, user)
            with open(os.path.join(RAW, key + ".raw"), "wb") as f: f.write(raw)
            rows = parse_stores(raw)
            now = time.strftime("%Y-%m-%d")
            db.execute("DELETE FROM branches WHERE chain=?", (key,))
            db.executemany("INSERT OR REPLACE INTO branches VALUES(?,?,?,?,?,?)",
                           [(key, r["branch_id"], r["name"], r["address"], r["city"], now) for r in rows])
            db.commit()
            report.append((key, name, "OK", f"{len(rows)} branches from {fname}"))
        except Exception as e:
            report.append((key, name, "FAILED", f"{type(e).__name__}: {e}"))
        time.sleep(PAUSE)
    print("\n=== COVERAGE REPORT (store lists) ===")
    for key, name, st, msg in report: print(f"{st:8} {key:12} {msg}")
    ok = sum(1 for r in report if r[2] == "OK")
    total = db.execute("SELECT COUNT(*) FROM branches").fetchone()[0]
    cities = db.execute("SELECT COUNT(DISTINCT city) FROM branches").fetchone()[0]
    print(f"\nChains reachable: {ok} of {len(report)} tried | branches: {total} | distinct city names: {cities}")

if __name__ == "__main__":
    main()
