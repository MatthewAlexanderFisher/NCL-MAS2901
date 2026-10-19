"""Check chapter metadata for every question included by the bank (stdlib only)."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
MAIN = ROOT / "content/appendix/question-bank.qmd"
INCLUDE = re.compile(r'\{\{< include ([^ ]+) >\}\}')
QUESTION = re.compile(
    r'^:::+ \{([^\n]*\.question\b[^\n]*)\}\s*\n'
    r'#{2,3} Question (\d+): ([^\n]+)', re.M
)


def read_includes(path, ancestors=()):
    if path in ancestors:
        raise ValueError(f"Include cycle at {path}")
    text = path.read_text()
    return INCLUDE.sub(
        lambda m: read_includes((path.parent / m[1]).resolve(), (*ancestors, path)),
        text,
    )


def check():
    text = read_includes(MAIN)
    matches = list(QUESTION.finditer(text))
    callouts = re.findall(r'^:::+ \{[^\n]*\.question\b[^\n]*\}', text, re.M)
    assert len(matches) == len(callouts), "Every question needs an explicit numbered title"
    numbers = set()
    related = {n: 0 for n in range(1, 11)}
    cumulative = {n: 0 for n in range(1, 11)}
    for match in matches:
        attrs, number, title = match.groups()
        number = int(number)
        assert number > 0 and number not in numbers, f"Duplicate/invalid number: {number}"
        numbers.add(number)
        chapters = re.search(r'data-chapters="([\d ]+)"', attrs)
        ready = re.search(r'data-ready-after="(\d+)"', attrs)
        assert chapters and ready, f"Question {number} needs chapter coverage"
        chapters = [int(n) for n in chapters[1].split()]
        ready = int(ready[1])
        assert chapters == sorted(set(chapters)), f"Question {number}: sort/deduplicate chapters"
        assert chapters and all(1 <= n <= 10 for n in chapters), f"Question {number}: invalid chapter"
        assert 1 <= ready <= 10, f"Question {number}: invalid completion chapter"
        assert ready >= max(chapters), f"Question {number}: completion precedes a required topic"
        for n in chapters:
            related[n] += 1
        for n in cumulative:
            cumulative[n] += ready <= n
    assert numbers, "No questions found"
    print(f"Validated {len(numbers)} questions; next unused number is {max(numbers) + 1}.")
    for n in related:
        print(f"Chapter {n}: {related[n]} relevant; {cumulative[n]} covered so far")


if __name__ == "__main__":
    check()
