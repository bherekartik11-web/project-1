"use strict";

(() => {
  const STORAGE_KEY = "mockly.practice.v1";
  const QUESTION_BANK = {
    "Software Engineer": [
      "Tell me about a technical problem you solved that had a meaningful impact.",
      "Describe a time you improved the reliability or performance of a system.",
      "How do you approach a disagreement about a technical design?"
    ],
    "Product Manager": [
      "How do you decide what to build when your team has competing priorities?",
      "Tell me about a product decision you made with incomplete information.",
      "Describe a launch that did not go as planned. What did you learn?"
    ],
    "UX Designer": [
      "Walk me through a design decision you made based on user research.",
      "Tell me about a time you had to balance user needs with business constraints.",
      "How do you know when a design is ready to ship?"
    ],
    "Data Analyst": [
      "Tell me about a time your analysis changed someone’s mind or decision.",
      "How would you investigate a sudden drop in a key business metric?",
      "Describe how you made a complex analysis understandable to others."
    ],
    "Marketing Manager": [
      "How would you measure the success of a campaign with a limited budget?",
      "Tell me about a campaign that underperformed and how you responded.",
      "How do you decide which audience segment to prioritize?"
    ],
    "Customer Success": [
      "Tell me about a time you helped a frustrated customer reach a good outcome.",
      "How do you prioritize customers when several need urgent help?",
      "Describe how you used customer feedback to improve a process."
    ]
  };
  const $ = (selector) => document.querySelector(selector);
  const form = $("#practice-form");
  const session = $("#session");
  const answer = $("#answer");
  const result = $("#question-result");
  let current = null;
  let questionIndex = 0;
  let recognition = null;
  let toastTimer;

  function readHistory() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(value) ? value.filter((item) => item && typeof item.role === "string" && typeof item.question === "string" && typeof item.date === "string") : [];
    } catch {
      return [];
    }
  }

  function announce(message) {
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("on");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("on"), 2800);
  }

  function renderHistory() {
    const list = $("#history-list");
    const history = readHistory().slice(0, 6);
    list.replaceChildren();
    if (!history.length) {
      const empty = document.createElement("p");
      empty.className = "empty-history";
      empty.textContent = "Your completed practice rounds will show up here on this device.";
      list.append(empty);
      return;
    }
    for (const item of history) {
      const card = document.createElement("article");
      card.className = "history-item";
      const title = document.createElement("strong");
      title.textContent = item.role + " · " + item.level;
      const date = document.createElement("span");
      const parsedDate = new Date(item.date);
      date.textContent = (Number.isNaN(parsedDate.getTime()) ? "Practice completed" : parsedDate.toLocaleDateString()) + " · " + item.words + " words";
      card.append(title, date);
      list.append(card);
    }
  }

  function startSession(role, level) {
    current = { role, level };
    const bank = QUESTION_BANK[role];
    questionIndex = Math.floor(Math.random() * bank.length);
    $("#session-role").textContent = role;
    $("#session-level").textContent = level;
    $("#session-question").textContent = bank[questionIndex];
    $("#session-subtitle").textContent = "Question " + (questionIndex + 1) + " of " + bank.length;
    answer.value = "";
    $("#word-count").textContent = "0 words";
    $("#insights").classList.remove("show");
    $("#insights").replaceChildren();
    $("#submit-answer").disabled = false;
    session.classList.add("open");
    session.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    answer.focus();
  }

  function closeSession() {
    if (recognition) recognition.stop();
    session.classList.remove("open");
    session.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    current = null;
  }

  function wordCount(text) {
    const matches = text.trim().match(/\S+/g);
    return matches ? matches.length : 0;
  }

  function giveFeedback() {
    const text = answer.value.trim();
    const words = wordCount(text);
    if (words < 12) {
      answer.focus();
      announce("Add a little more detail before requesting feedback (at least 12 words). ");
      return;
    }
    const lower = text.toLowerCase();
    const hasContext = /\b(when|while|after|before|during|because|team|project|customer|user)\b/.test(lower);
    const hasAction = /\b(i|we)\s+(led|built|created|changed|improved|designed|analyzed|analysis|launched|helped|decided|worked|identified|reduced|increased|delivered|implemented|organized|measured)\b/.test(lower);
    const hasOutcome = /\b(result|impact|increased|reduced|improved|saved|grew|achieved|learned|%|percent|users|revenue|faster)\b/.test(lower);
    const insightBox = $("#insights");
    insightBox.replaceChildren();
    const heading = document.createElement("h3");
    heading.textContent = "Your practice notes";
    insightBox.append(heading);
    const notes = [
      words >= 45 ? "Good detail: your answer has enough substance to develop a clear story." : "Try adding more detail about the situation and what was at stake.",
      hasAction ? "You described actions you took. Keep the focus on your own contribution." : "Make your role explicit with phrases such as ‘I decided’, ‘I built’ or ‘I led’. ",
      hasOutcome ? "You included an outcome. A specific number or observable change can make it even clearer." : "Close with the result: what changed, and how did you know it worked?",
      hasContext ? "You gave some context. Check that the listener can understand the challenge." : "Set the scene briefly so the interviewer understands the challenge."
    ];
    for (const note of notes) {
      const paragraph = document.createElement("p");
      paragraph.textContent = note;
      insightBox.append(paragraph);
    }
    insightBox.classList.add("show");
    const history = readHistory();
    history.unshift({ role: current.role, level: current.level, question: $("#session-question").textContent, words, date: new Date().toISOString() });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
      renderHistory();
    } catch {
      announce("Feedback is ready, but this browser could not save your practice history.");
    }
    $("#submit-answer").disabled = true;
    announce("Your practice notes are ready.");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const role = $("#role").value;
    const level = $("#level").value;
    if (!Object.hasOwn(QUESTION_BANK, role) || !["Entry level", "Mid level", "Senior", "Career change"].includes(level)) {
      result.textContent = "Choose a valid role and experience level to begin.";
      result.classList.add("show");
      return;
    }
    const firstQuestion = QUESTION_BANK[role][0];
    result.replaceChildren();
    const label = document.createElement("small");
    label.textContent = role + " · " + level;
    const question = document.createElement("span");
    question.textContent = firstQuestion;
    result.append(label, question);
    result.classList.add("show");
    startSession(role, level);
    question.textContent = $("#session-question").textContent;
  });

  answer.addEventListener("input", () => { $("#word-count").textContent = wordCount(answer.value) + " words"; });
  $("#submit-answer").addEventListener("click", giveFeedback);
  $("#close-session").addEventListener("click", closeSession);
  session.addEventListener("click", (event) => { if (event.target === session) closeSession(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && session.classList.contains("open")) closeSession(); });
  $("#clear-history").addEventListener("click", () => {
    try { localStorage.removeItem(STORAGE_KEY); renderHistory(); announce("Practice history cleared."); }
    catch { announce("This browser could not clear the saved history."); }
  });
  $("#voice-input").addEventListener("click", () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { announce("Voice input is not available in this browser. You can type your answer instead."); return; }
    if (recognition) { recognition.stop(); recognition = null; $("#voice-input").textContent = "Use voice"; return; }
    recognition = new SpeechRecognition();
    recognition.lang = navigator.language || "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    const existing = answer.value;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((item) => item[0].transcript).join(" ");
      answer.value = (existing + (existing && transcript ? " " : "") + transcript).slice(0, 5000);
      answer.dispatchEvent(new Event("input"));
    };
    recognition.onerror = () => announce("Voice input stopped. Check microphone permission and try again.");
    recognition.onend = () => { recognition = null; $("#voice-input").textContent = "Use voice"; };
    try { recognition.start(); $("#voice-input").textContent = "Stop voice"; }
    catch { recognition = null; announce("Could not start voice input. Check microphone permission and try again."); }
  });
  $("#year").textContent = String(new Date().getFullYear());
  $("#demo-submit").addEventListener("click", () => announce("Demo answer submitted. Start a practice round to try it yourself."));
  renderHistory();
})();
