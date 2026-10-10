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
