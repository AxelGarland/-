# Build log

Plain-English diary of how this app got built. Times are UTC.

## Stage 1 - Check the tools, make the folder (2026-10-10 11:27)
- Checked the machine. Surprise: this session runs in a **cloud Linux container**, not on the Mac. There is no ~/Desktop and no Homebrew here.
- Tools found: Python 3.13 (with built-in sqlite3), Node 22, git, curl.
- Not found: cloudflared (the https tunnel tool).
- The folder lives inside the project repo as `grocery-app/`, because that is the only place the app can show me files.
