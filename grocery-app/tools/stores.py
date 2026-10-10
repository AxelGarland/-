"""Read a chain's Stores XML (any of the known layouts) into plain dicts. Standard library only."""
import gzip, io, zipfile
import xml.etree.ElementTree as ET

WANT = {"storeid": "branch_id", "storename": "name", "address": "address", "city": "city"}

def unpack(data: bytes) -> bytes:
    """Files are gzip or zip depending on the chain; sniff the first bytes."""
    if data[:2] == b"\x1f\x8b":
        return gzip.decompress(data)
    if data[:2] == b"PK":
        z = zipfile.ZipFile(io.BytesIO(data))
        return z.read(z.namelist()[0])
    return data

def parse_stores(xml_bytes: bytes):
    xml_bytes = unpack(xml_bytes)
    # some chains send UTF-16 or have a BOM; ElementTree handles the XML declaration.
    root = ET.fromstring(xml_bytes)
    out = []
    for el in root.iter():
        if el.tag.split("}")[-1].lower() != "store":
            continue
        row = {}
        for child in el:
            key = WANT.get(child.tag.split("}")[-1].lower())
            if key and child.text:
                row[key] = " ".join(child.text.split())
        if row.get("branch_id"):
            row.setdefault("name", ""); row.setdefault("address", ""); row.setdefault("city", "")
            out.append(row)
    return out
