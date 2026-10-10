# Build log

Plain-English diary of how this app got built. Times are UTC.

## Stage 1 - Check the tools, make the folder (2026-10-10 11:27)
- Checked the machine. Surprise: this session runs in a **cloud Linux container**, not on the Mac. There is no ~/Desktop and no Homebrew here.
- Tools found: Python 3.13 (with built-in sqlite3), Node 22, git, curl.
- Not found: cloudflared (the https tunnel tool).
- The folder lives inside the project repo as `grocery-app/`, because that is the only place the app can show me files.

## Stage 2 - Find the data tool, download store lists (2026-10-10 11:29)
**Result: BLOCKED. No store lists downloaded. Nothing was faked.**

What I tried:
- Probed the chains' publishing sites from the cloud container: prices.shufersal.co.il, url.retail.publishedprices.co.il (the shared host many chains use), the Azure storage Shufersal-style hosts, and Nominatim (the free geocoder).
- Every one of them came back as "403 Forbidden" from the container's network proxy. That is the cloud environment's own network allow-list, not the chains refusing us. Only package sites (PyPI, npm) and GitHub's file host are open.

What I learned about the open-source tool:
- Best candidate: **il-supermarket-scraper** (PyPI, repo OpenIsraeliSupermarkets/israeli-supermarket-scarpers, author Sefi Erlich). Covers about 35 chain scrapers (Shufersal, Rami Levy, Victory, Yochananof, Osher Ad, Tiv Taam, Bitan, Keshet, Dor Alon and more).
- Licence: **custom, non-commercial use only, attribution required**. Fine for a free experiment; we must credit the author and link the repo, and nobody may sell this.
- Downsides: heavy install (MongoDB client, Playwright with a "stealth" add-on that hides that it is a robot). I am not comfortable with the stealth part. Plan: use its list of chains and its parsing ideas, and write our own small polite downloader instead of running it as-is.
- Could not yet check the other three projects named in the brief.

Decision needed: the network. Chains can only be reached if the cloud environment's network access is widened, or if the downloads run on the Mac.

## Stage 2b - Retry after widening the network (2026-10-10 11:31)
- Axel changed the cloud network setting and said go. Retested Shufersal, the shared publishedprices host, Nominatim, Rami Levy and gov.il.
- Still "403 Forbidden" from the container's proxy on every one. The setting change has not reached this running session.
- Likely cause: network settings only apply to a **new** session, so this one still has the old rules.

## Stage 2c - Switched to the Mac plan (2026-10-10 11:32)
- Axel chose to run the download step on the Mac. Wrote (but could NOT run against real sites from here):
  - `tools/chains.py`: the chain list. Adding a chain = one line.
  - `tools/fetch_stores.py`: downloads one store-list file per chain, 2 s pause, honest User-Agent, writes `data/stores.sqlite`, prints the coverage report.
  - `tools/stores.py`: reads the XML (gzip or zip, two known layouts).
- Parser tested with 2 tiny made-up XML files (clearly labelled as fixtures): pass. That proves the parser's logic only, not that the real sites work.
- Honest caveat: the web addresses and login steps for the shared server are from memory of how other projects do it. Untested. Expect to fix something on first run.
- Raw downloads and the database are git-ignored: the chains own that data and we do not publish it.
- Decision for Axel: the shared server (Rami Levy, Victory, Yohananof, Osher Ad, Tiv Taam...) needs a public username with an empty password. Off by default.

## Stage 2d - First real run, on the Mac (2026-10-10 11:42)
- A Claude session on Axel's Mac read the code first, then ran `python3 tools/fetch_stores.py` (no public logins).
- **Shufersal worked first time: 417 branches, 111 distinct city names.** So the untested web address and parser from memory were right for this chain.
- The other 9 chains (Rami Levy, Victory, Yohananof, Osher Ad, Tiv Taam, Keshet, Dor Alon, Hazi Hinam, Stop Market) were skipped on purpose: they need the shared server's public login, which Axel has not approved yet.
- Coverage so far: 1 chain of 10 tried.
- Reported by Axel's paste (the terminal output was partly garbled in the paste). The data files stay on the Mac and are git-ignored.
- Lesson for the video: the cloud machine could not reach the sites, the Mac could. Same code, different network.

## Decision (2026-10-10 11:44)
- Axel approved the shared server's public logins (public username, empty password) for the 9 skipped chains. Next: re-run `python3 tools/fetch_stores.py --allow-public-logins` on the Mac.

## Stage 2e - Shared-server chains failed (2026-10-10 11:47)
- Ran with public logins. Shufersal OK (417). Rami Levy and 7 others: logged in, but the file list had no file named "Stores...". Victory: reply was not JSON.
- Nothing written for failed chains. Database still holds Shufersal only.
- Honest guess (not yet proven): the file-name filter or listing format I wrote from memory is wrong.
- Next step: added `--debug` to print the real listing for one chain (`--only rami_levy`), then fix the filter from evidence. Filter also loosened to any name containing "store".

## Stage 2f - Found the cause: security token (2026-10-10 11:49)
- `--debug` on Rami Levy and Victory showed the real reason: Rami Levy's server rejected the file-list request with a security-token (CSRF) failure, so the empty list never meant "no Stores file". Victory returned a web page instead of data (likely failed login).
- Hypothesis (not yet proven): the server issues a fresh token after login. Fix: after login, load /file, read the new token, use it for the list request; and say plainly when the login form shows up again.
- Not proven until re-run on the Mac.
