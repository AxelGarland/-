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

def fetch_cerberus(opener, user):
    login = get(opener, CERBERUS + "/login").decode("utf-8", "replace")
    m = re.search(r'name="csrftoken"[^>]*content="([^"]+)"|csrftoken["\']?\s*content="([^"]+)"|content="([^"]+)"\s+name="csrftoken"', login)
    token = next((g for g in (m.groups() if m else []) if g), "")
    body = urllib.parse.urlencode({"username": user, "password": "", "Submit": "Sign in", "csrftoken": token}).encode()
    get(opener, CERBERUS + "/login/user", body); time.sleep(PAUSE)
    body = urllib.parse.urlencode({"sEcho": 1, "iColumns": 5, "iDisplayStart": 0, "iDisplayLength": 100000,
                                   "sSearch": "", "iSortingCols": 0, "cd": "/", "csrftoken": token}).encode()
    listing = json.loads(get(opener, CERBERUS + "/file/json/dir", body))
    files = [f for f in listing.get("aaData", []) if re.match(r"stores", f.get("fname", ""), re.I)]
    if not files:
        raise RuntimeError("logged in, but no 'Stores' file in the directory listing")
    newest = max(files, key=lambda f: f.get("time", ""))
    time.sleep(PAUSE)
    return get(opener, CERBERUS + "/file/d/" + urllib.parse.quote(newest["fname"])), newest["fname"]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--allow-public-logins", action="store_true")
    ap.add_argument("--only", help="comma-separated chain keys")
    a = ap.parse_args()
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
