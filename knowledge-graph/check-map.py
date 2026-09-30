"""Check catalogue coverage, relationships and links after a Quarto render.

Run from any directory with: python3 knowledge-graph/check-map.py
Uses only the Python standard library.
"""

import json
import re
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
data = json.loads((ROOT / "knowledge-graph/course-graph.json").read_text())


class Anchors(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.add(attrs["id"])


def unique(items, label):
    ids = [item["id"] for item in items]
    assert len(ids) == len(set(ids)), f"Duplicate {label} IDs"
    return set(ids)


parts = unique(data["parts"], "part")
chapters = {chapter["id"]: chapter for chapter in data["chapters"]}
unique(data["chapters"], "chapter")
nodes = unique(data["nodes"], "node")
relationships = unique(data["relationshipTypes"], "relationship")
page_anchors = {}


def check_link(href):
    url = urlsplit(href)
    assert not url.scheme and not url.netloc and not url.path.startswith("/"), href
    path = unquote(url.path)
    assert ".." not in Path(path).parts, href
    if path not in page_anchors:
        file = ROOT / "docs" / path
        assert file.is_file(), f"Missing rendered page: {href}"
        parser = Anchors()
        parser.feed(file.read_text())
        page_anchors[path] = parser.ids
    assert not url.fragment or unquote(url.fragment) in page_anchors[path], f"Missing anchor: {href}"


for chapter in chapters.values():
    assert chapter["part"] in parts, chapter
    check_link(chapter["href"])

defaults = Counter()
for node in data["nodes"]:
    assert node["chapter"] in chapters, node
    chapter = chapters[node["chapter"]]
    assert node["part"] == chapter["part"], node
    assert node["href"].split("#")[0] == chapter["href"].split("#")[0], node
    assert node["label"] and node["description"], node
    check_link(node["href"])
    if node.get("defaultForPage"):
        defaults[node["chapter"]] += 1
assert set(defaults) == set(chapters) and all(count == 1 for count in defaults.values()), defaults

edge_keys = set()
connected = set()
for edge in data["edges"]:
    assert edge["source"] in nodes and edge["target"] in nodes, edge
    assert edge["source"] != edge["target"], edge
    assert edge["type"] in relationships, edge
    key = (edge["source"], edge["target"], edge["type"])
    assert key not in edge_keys, edge
    edge_keys.add(key)
    connected.update((edge["source"], edge["target"]))
assert connected == nodes, f"Isolated entries: {nodes - connected}"

# Compare with active chapter lines; commented-out pages are intentionally excluded.
configured = set(re.findall(r"^\s*-\s+([\w/.-]+)\.qmd\s*$", (ROOT / "_quarto.yml").read_text(), re.M))
mapped = {chapter["href"].removesuffix(".html") for chapter in chapters.values()}
assert configured == mapped, f"Unmapped pages: {configured - mapped}; inactive pages: {mapped - configured}"

print(f"Course map verified: {len(nodes)} entries, {len(edge_keys)} relationships, "
      f"{len(chapters)} active pages; all anchors and page defaults valid.")
