"""The list of chains. Adding a chain = adding one line to CHAINS.

kind "shufersal": public page, no login.
kind "cerberus":  the shared publishedprices.co.il server. Each chain has a public
                  username and an EMPTY password. That is a login, so it is OFF unless
                  you run fetch_stores.py with --allow-public-logins.
"""
CHAINS = {
    # key:            (display name,   kind,        login/username)
    "shufersal":      ("שופרסל",       "shufersal", None),
    "rami_levy":      ("רמי לוי",      "cerberus",  "RamiLevi"),
    "victory":        ("ויקטורי",      "cerberus",  "Victory"),
    "yohananof":      ("יוחננוף",      "cerberus",  "yohananof"),
    "osher_ad":       ("אושר עד",      "cerberus",  "osherad"),
    "tiv_taam":       ("טיב טעם",      "cerberus",  "TivTaam"),
    "keshet":         ("קשת טעמים",    "cerberus",  "Keshet"),
    "dor_alon":       ("שוק מיטב/דור אלון", "cerberus", "doralon"),
    "hazi_hinam":     ("חצי חינם",     "cerberus",  "HaziHinam"),
    "stop_market":    ("סטופ מרקט",    "cerberus",  "Stop_Market"),
}
# Not yet wired (own sites, not the shared server): Yeinot Bitan, Carrefour/Mega, Super-Pharm...
