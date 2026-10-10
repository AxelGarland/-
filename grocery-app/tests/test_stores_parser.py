"""Parser test. The XML below is MADE UP by us to check the parser's shape handling. It is not real chain data."""
import gzip, os, sys, unittest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tools"))
from stores import parse_stores

SHUFERSAL_SHAPE = "<asx:abap xmlns:asx='http://www.sap.com/abapxml'><asx:values><STORES><STORE><STOREID>1</STOREID><STORENAME>בדיקה  א</STORENAME><ADDRESS>הרצל 1</ADDRESS><CITY>חיפה</CITY></STORE></STORES></asx:values></asx:abap>"
CERBERUS_SHAPE = "<Root><SubChains><SubChain><Stores><Store><StoreId>7</StoreId><StoreName>בדיקה ב</StoreName><Address>דיזנגוף 5</Address><City>תל אביב</City></Store></Stores></SubChain></SubChains></Root>"

class T(unittest.TestCase):
    def test_shufersal_shape(self):
        r = parse_stores(SHUFERSAL_SHAPE.encode())
        self.assertEqual(r[0]["branch_id"], "1"); self.assertEqual(r[0]["name"], "בדיקה א")
    def test_cerberus_shape_gzipped(self):
        r = parse_stores(gzip.compress(CERBERUS_SHAPE.encode()))
        self.assertEqual((r[0]["city"], r[0]["address"]), ("תל אביב", "דיזנגוף 5"))
if __name__ == "__main__": unittest.main()
