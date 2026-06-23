const questions = window.QUIZ_QUESTIONS || [];

const state = {
  order: [],
  current: 0,
  answered: new Map(),
};

const els = {
  total: document.querySelector("#total-count"),
  score: document.querySelector("#score-count"),
  wrong: document.querySelector("#wrong-count"),
  position: document.querySelector("#question-position"),
  sourceId: document.querySelector("#source-id"),
  progress: document.querySelector("#progress-bar"),
  displayNumber: document.querySelector("#display-number"),
  questionText: document.querySelector("#question-text"),
  answers: document.querySelector("#answers"),
  feedback: document.querySelector("#feedback"),
  prev: document.querySelector("#prev-btn"),
  next: document.querySelector("#next-btn"),
  shuffle: document.querySelector("#shuffle-btn"),
  reset: document.querySelector("#reset-btn"),
};

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function formatId(id) {
  return String(id).padStart(3, "0");
}

function buildQuestionInstance(question) {
  return {
    ...question,
    randomizedOptions: shuffle(
      question.options.map((text, index) => ({
        text,
        isCorrect: index === question.correctIndex,
      }))
    ),
  };
}

function startSession(keepResults = false) {
  state.order = shuffle(questions).map(buildQuestionInstance);
  state.current = 0;
  if (!keepResults) {
    state.answered.clear();
  }
  render();
}

function currentQuestion() {
  return state.order[state.current];
}

function updateStats() {
  const answered = [...state.answered.values()];
  const correct = answered.filter((answer) => answer.isCorrect).length;
  const wrong = answered.length - correct;

  els.total.textContent = String(questions.length);
  els.score.textContent = String(correct);
  els.wrong.textContent = String(wrong);
  els.position.textContent = `Domanda ${state.current + 1} di ${state.order.length}`;
  els.progress.style.width = `${((state.current + 1) / state.order.length) * 100}%`;
}

function renderFeedback(question) {
  const answer = state.answered.get(question.id);
  els.feedback.hidden = answer === undefined;
  els.feedback.className = "feedback";

  if (answer?.isCorrect) {
    els.feedback.classList.add("good");
    els.feedback.textContent = "Risposta corretta.";
  } else if (answer) {
    els.feedback.classList.add("bad");
    const correct = question.randomizedOptions.find((option) => option.isCorrect);
    els.feedback.textContent = `Risposta errata. Corretta: ${correct.text}`;
  }
}

function renderAnswers(question) {
  const answered = state.answered.has(question.id);
  els.answers.replaceChildren();

  question.randomizedOptions.forEach((option, index) => {
    const button = document.createElement("button");
    const letter = String.fromCharCode(65 + index);
    button.type = "button";
    button.className = "answer";
    button.disabled = answered;
    button.innerHTML = `<span class="answer-letter">${letter}</span><span>${option.text}</span>`;

    if (answered && option.isCorrect) {
      button.classList.add("correct");
    }
    if (answered && state.answered.get(question.id).selectedIndex === index && !option.isCorrect) {
      button.classList.add("incorrect");
    }

    button.addEventListener("click", () => {
      state.answered.set(question.id, {
        isCorrect: option.isCorrect,
        selectedIndex: index,
      });
      render();
    });

    els.answers.append(button);
  });
}

function render() {
  if (!state.order.length) return;

  const question = currentQuestion();
  els.displayNumber.textContent = formatId(question.id);
  els.sourceId.textContent = `PDF n. ${formatId(question.id)}`;
  els.questionText.textContent = question.question;

  updateStats();
  renderAnswers(question);
  renderFeedback(question);

  els.prev.disabled = state.current === 0;
  els.next.textContent = state.current === state.order.length - 1 ? "Fine" : "Successiva";
}

function move(delta) {
  const next = state.current + delta;
  if (next >= 0 && next < state.order.length) {
    state.current = next;
    render();
  }
}

els.prev.addEventListener("click", () => move(-1));
els.next.addEventListener("click", () => {
  if (state.current < state.order.length - 1) {
    move(1);
  }
});
els.shuffle.addEventListener("click", () => startSession(true));
els.reset.addEventListener("click", () => startSession(false));

startSession(false);
