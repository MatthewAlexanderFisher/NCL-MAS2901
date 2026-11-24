(() => {
  const sectionA = [
    ['a-estimator'],
    ['a-likelihood'],
    ['a-interval'],
    ['a-testing', 'a-bayes']
  ];
  const sectionB = [['b-estimation'], ['b-bayes'], ['b-testing']];

  function shuffle(questions) {
    const shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  function selectQuestions(questions, previous) {
    const pools = [...sectionA, ...sectionB].map(slots =>
      shuffle(questions.filter(question => slots.includes(question.dataset.slot)))
    );
    const paper = [];
    const families = new Set();

    // Backtrack to avoid related questions and preserve a mix of specimen and other bank questions.
    function fillPaper(index) {
      if (index === pools.length) {
        return paper.some(question => question.dataset.examOrigin === 'specimen')
          && paper.some(question => question.dataset.examOrigin !== 'specimen')
          && paper.some((question, position) => question !== previous[position]);
      }

      for (const question of pools[index]) {
        const family = question.dataset.family || question.id;
        if (families.has(family)) continue;

        families.add(family);
        paper.push(question);
        if (fillPaper(index + 1)) return true;
        paper.pop();
        families.delete(family);
      }
      return false;
    }

    return fillPaper(0) ? paper : null;
  }

  function renderQuestion(question, number) {
    const article = document.createElement('article');
    article.className = 'exam-question';

    const heading = document.createElement('h3');
    heading.textContent = `Question ${number}`;
    const marks = document.createElement('span');
    marks.textContent = `${question.dataset.marks} marks`;
    heading.append(' ', marks);

    const source = document.createElement('p');
    source.className = 'exam-source-note';
    const link = document.createElement('a');
    link.href = `question-bank.html#${question.dataset.bankId}`;
    link.textContent = question.dataset.source;
    source.append(link);

    article.append(heading, question, source);
    return article;
  }

  function renderSolution(solution, number) {
    const details = document.createElement('details');
    details.className = 'exam-solution';
    const label = document.createElement('summary');
    label.textContent = `Question ${number} solution`;
    details.append(label, solution);
    return details;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const pool = document.querySelector('#exam-question-pool');
    const questions = Array.from(pool.querySelectorAll(':scope > .exam-source'));
    const solutions = new Map(Array.from(pool.querySelectorAll(':scope > .exam-source-solution'),
      solution => [solution.dataset.questionId, solution]));
    const exam = document.querySelector('#practice-exam');
    const aQuestions = document.querySelector('#practice-exam-a-questions');
    const bQuestions = document.querySelector('#practice-exam-b-questions');
    const generateButton = document.querySelector('#generate-practice-exam');
    const printButton = document.querySelector('#print-practice-exam');
    const solutionsButton = document.querySelector('#toggle-practice-exam-solutions');
    const solutionList = document.querySelector('#practice-exam-solutions');
    const status = document.querySelector('#practice-exam-status');
    let current = [];

    function showSolutions(show) {
      solutionList.hidden = !show;
      solutionsButton.textContent = show ? 'Hide solutions' : 'Show solutions';
      solutionsButton.setAttribute('aria-expanded', String(show));
    }

    function generateExam() {
      const paper = selectQuestions(questions, current);
      if (!paper) {
        status.textContent = current.length
          ? 'There are no other papers available from the current question pool.'
          : 'A practice exam could not be generated. You can still practise with the Question Bank.';
        return;
      }

      const articles = paper.map((question, index) => renderQuestion(question, index + 1));
      aQuestions.replaceChildren(...articles.slice(0, sectionA.length));
      bQuestions.replaceChildren(...articles.slice(sectionA.length));
      showSolutions(false);
      solutionList.replaceChildren(...paper.map((question, index) =>
        renderSolution(solutions.get(question.id), index + 1)
      ));
      exam.hidden = false;
      printButton.disabled = false;
      status.textContent = current.length ? 'New practice exam generated.' : '';
      current = paper;
    }

    generateButton.disabled = false;
    generateButton.addEventListener('click', generateExam);
    printButton.addEventListener('click', () => window.print());
    solutionsButton.addEventListener('click', () => showSolutions(solutionList.hidden));
    generateExam();
  }, {once: true});
})();
