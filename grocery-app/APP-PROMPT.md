# Prompt: Hebrew supermarket price-comparison web app (MethodPlay experiment)

Copy everything below the line into a new Claude Code session.
Run that session LOCALLY on the Mac (Claude desktop app, local session), not in the cloud. Reason: cloud sessions block the Israeli price sites.

---

You are building a small web app with me, live, while I record my screen. I am not a programmer, so explain what you are doing in one or two plain sentences before each step, and keep going without asking permission for ordinary things (creating files, running the app, installing packages inside the project folder). Ask me only when a real decision is mine, or when something needs a password, a key, or a sign-up.

## The goal
A Hebrew, right-to-left web page that I open on my phone. It works like "supermarkets near me":
1. I open the page and my phone's browser asks for permission to use my location. I tap Allow. I never type an address.
2. I type a shopping list, one item per line (for example "חלב 3%", "ביצים", "לחם אחיד").
3. It finds supermarket branches near me, from as many Israeli chains as it can get real data for, sorted by distance, and shows what my basket costs at each branch. It highlights the cheapest branch, the nearest branch, and the difference in shekels.

This is the first MethodPlay video ("We use AI, code, and design to make useful, imaginative things that help people, and share how we build them"). The build is the content, so honest and real beats polished. If something breaks, say so in plain words and try the next-simplest approach. Never fake data. Anything not real must be labelled as sample or test data.

## Environment (learned the hard way)
- Run on my Mac. Cloud sessions get "403 Forbidden" from their network proxy on every Israeli price site and on the free geocoder.
- Check `python3 --version` first. My Mac has Python 3.9: do NOT use backslashes inside f-string expressions, and avoid syntax newer than 3.9.
- Folder: `~/Desktop/grocery-app`. Everything in one folder. Standard-library Python plus, at most, one small parser library. One command to run. No build step.
- Keep `BUILD-LOG.md` as you go: each stage, what you tried, what failed, what worked, with timestamps, in plain English. I use it for the video description and a newsletter.

## Location (hard requirement, with a catch)
- Use the browser's real `navigator.geolocation`, triggered by a clear Hebrew button: "מצא סופרים לידי".
- Phones only allow location on https or on localhost. On the Mac, `http://localhost:PORT` works for testing. For the phone, use a free Cloudflare quick tunnel: `cloudflared tunnel --url http://localhost:PORT` (no account). Check whether `cloudflared` and Homebrew exist. If cloudflared is missing, tell me and ask before `brew install cloudflared`. Use no tool that needs sign-up or a card.
- Tell me plainly what the tunnel means: while it runs, anyone with the random link can open the page. So the page contains only public price data and nothing personal. Print the https address and a QR code in the terminal (or just the address if QR is a hassle). I stop the tunnel when done, and you confirm it is stopped.
- Privacy: coordinates are used only to pick nearby branches. Never write them to any file or log. Keep them in memory for the session only, and say so in the README.
- If I tap "Don't allow" or location fails, show a friendly Hebrew message and a small text box to type a city or street. That fallback is only for denial.

## Data: what is known so far
Israeli chains must publish price files (gzipped XML: a store-list file per chain, a price file per branch). The riskiest part, so do it first.
- **Shufersal works with no login.** The store-list page `https://prices.shufersal.co.il/FileObject/UpdateCategory?catID=5&storeId=0&sort=Time&sortdir=Desc&page=1` lists links to Stores files. Parsing the newest one gave 417 branches in 111 distinct city names. Price files use the same site with a different catID (check the page; do not guess).
- **The shared server `url.retail.publishedprices.co.il` (Cerberus, used by Rami Levy, Victory, Yohananof, Osher Ad, Tiv Taam, Keshet, Dor Alon, Hazi Hinam, Stop Market and others) did NOT work with the public usernames I tried and an empty password.** The login page returned again after login. The login page also shows "Request an Account", so it now looks like it needs real accounts. Safari also shows a certificate warning for it. Do not turn off certificate checking. Do not search for or use leaked passwords. If it needs an account, stop and tell me; I decide.
- Next best idea: many chains have a price-transparency link ("שקיפות מחירים" / "מחירון") on their own website, often with no login. Check each chain's own site (for example https://www.rami-levy.co.il/he) and report the exact address and whether it opens without login, before downloading anything.
- Open-source reference: `il-supermarket-scraper` (PyPI; repo OpenIsraeliSupermarkets/israeli-supermarket-scarpers, author Sefi Erlich). Licence is custom: non-commercial use only, credit the author and link the repo. It supports about 35 chains but is heavy (MongoDB client, Playwright with a "stealth" add-on). Use it as a reference for chain list and file layouts; write a small polite downloader instead. Credit it in the README.
- Do not hard-code a short list. Make adding a chain a one-line change (a `CHAINS` table). Add chains one by one and report honestly which worked and which did not (blocked, needs login, certificate problem, broken format). A chain that refuses is a finding, not a failure.

## Data design (small and polite)
1. Download only store-list files first, one per chain, with a 2 s pause and an honest User-Agent. Parse into SQLite: chain, branch ID, branch name, address, city, fetched date.
2. Store files have no coordinates. Geocode with OpenStreetMap Nominatim (max 1 request per second, proper User-Agent, cache every result forever). Two layers: first the distinct city names once; then, when I search, only branch addresses in cities within my radius plus a margin. Show progress, cache, skip and count addresses that cannot be found.
3. Download price files only for branches inside my radius, once, cached in `data/`, with a short delay. Never loop aggressively.
4. Coverage report in the terminal and on the page: chains reachable, branches found, branches geocoded, price files loaded, and explicit reasons for chains that failed.
5. Keep a small real sample in `data/sample/` (a few chains, one city) so the app runs on camera when a site is down or I am offline. In sample mode, say clearly on the page that it is sample data.
6. Record the date of every price file and show "Prices as of <date>" per branch.
7. Raw downloads and databases built from them are git-ignored. The chains own this data: never publish or redistribute their files.

Prove it before building the page: for a test city (my Mac's location if allowed, otherwise fixed city-centre coordinates), show a real list of nearby branches with chain, address and distance, and a few real rows (item name, barcode, price) from at least two chains.

## Scope for version 1
- Radius default 5 km, adjustable on the page (2, 5, 10, 20). At most 10 branches, nearest first, with an option to sort by cheapest.
- Input: a typed list. No accounts, no login, no receipts, no barcode scanning.
- No paid services, no API keys, no signing in to anything. If you think you need a key or password, stop and tell me.

## Matching what I type to products
- Normalize Hebrew spacing, quotes and punctuation, and search product names.
- For each line, show the top few candidates and let me tap the right one. Never silently guess. Prefer packaged products with barcodes. Fresh produce and bakery often use chain-specific codes and cannot be compared across chains: say so instead of pretending.
- Once I pick a product by barcode, look up the same barcode in every branch in range.
- If a branch lacks an item, show "not found" and how many are missing. Branches carrying the whole basket rank first. Never count a missing item as zero.
- Use the regular shelf price. Mention promotions only if the promotion files are easy to parse; otherwise say on the page that promotions are left out.

## The page
- Hebrew, `dir="rtl"`, one column, large tap targets. Steps: location button, your list, pick the products, results.
- A card per branch: chain, address, distance, basket total, "missing N items" if any, badges for "cheapest" and "nearest", and "Prices as of <date>".
- Look: MethodPlay colours only. Ink #0E0503 text, Gold #FEA600 main button, Navy #051A7A headings, Red #F80003 for the most expensive figure, White #FFFFFF background. Heebo font. Flat colour, thick ink borders, hard offset shadows, no gradients.
- Tiny English footer: "Here's a thing I tried. A MethodPlay experiment."

## How to work
Work in stages. After each stage stop, show me what it produced, say what comes next, and wait for me to say "go".
1. Check the Mac's tools, make the folder.
2. Download store lists for every chain that works; coverage report.
3. Geocode cities, then branches near a test location; show nearest branches.
4. Download price files for those branches; show real rows from at least two chains.
5. Matching and compare logic, tested in the terminal with five items.
6. The Hebrew page with the real location button on localhost; test the permission prompt in my Mac browser.
7. https tunnel, open on my phone, tap Allow, fix what looks wrong.
8. Stretch: more chains.
9. Write `README.md` and `BUILD-LOG.md`.

## Verify before you say "done"
- On my phone, tap Allow and run: חלב 3%, ביצים, לחם, אורז, שמן זית. Show the output.
- Tap "Don't allow" once and confirm the fallback message and text box.
- Check one price by hand: find one item in two branches of different chains in the downloaded files and confirm the page shows the same numbers.
- Check one distance against a map app.
- Confirm no keys, passwords, coordinates or personal data in any file or log.
- Confirm it works from sample data with the network off.
- Stop the tunnel and confirm it is stopped.

## README must say, in plain language
Where the data comes from and its date; that not every chain is covered and which are missing and why; that prices differ by branch and change daily; that promotions and member discounts may be missing; that distances are straight-line, not driving; how location is used and that it is not stored; that the chains own the data and nothing here redistributes their files; credit and link for any open-source tool used, with its licence terms; and that this is an experiment, not shopping advice. Do not claim savings you did not measure.

Start with stage 1.
