# Question-bank chapter coverage

Keep question numbers permanent. New questions take the next unused number;
never renumber existing questions when inserting or moving them.

Every `.question` callout has two required attributes:

- `data-chapters="5 7 9"` lists the chapters whose skills the question directly
  practises. Multiple chapters are allowed. Do not list every earlier chapter
  merely because it provides general background.
- `data-ready-after="9"` identifies the earliest chapter after which a student
  has covered the material for the **whole** question. Check every subpart, not
  just the title. This is topic coverage, not a difficulty or exam-scope rating.

For example, Question 78 covers likelihood, intervals, and testing. It appears
in the individual chapter lists for 5, 7, and 9, but in cumulative practice only
from Chapter 9. Question 98 is pure expectation algebra and is available from
Chapter 1 despite its Fisher-information-style expressions.

Chapter numbers follow the ten main chapters in `_quarto.yml`. The displayed
names are in `chapterCatalog` in `../question-bank.qmd`. The native chapter and
coverage selectors combine with the existing tag and difficulty filters.

Chapter-ending links use `?chapter=N&coverage=chapter` for relevant questions or
`?chapter=N&coverage=upto` for cumulative practice, with
`#question-chapter-filters` to land at the controls. Selection is retained in the
URL so the view can be bookmarked or shared. Chapter 10 currently has no
dedicated questions; the page explains this rather than assigning unrelated
Bayesian estimation questions to it.

Before rendering, run `python3 tools/questions/check-chapters.py` from the
repository root. This checks all included questions for valid coverage metadata
and unique permanent numbers. After editing coverage, verify cross-chapter
examples and cumulative filters in the rendered page.
