(function () {
  "use strict";

  const PAGE_SIZE = 5;
  const LABELS = ["A", "B", "C", "D"];
  const HALF_MEANING_DISTRACTORS = {
    core: ["그 어린 소녀가 기다린다", "마을 사람들이 바라본다", "한 작은 새가 날아간다", "나의 친구가 기억한다", "오래된 전화기가 움직인다"],
    rest: ["그 낡은 지도를 조용한 숲에서", "새로운 길을 이른 아침에", "따뜻한 편지를 친구와 함께", "높은 산 너머에서 천천히", "비가 온 뒤 작은 마을로"]
  };
  const COMMON_PREPOSITIONS = new Set(["at", "in", "on", "from", "to", "with", "for", "of", "by", "about", "under", "over", "through", "beside", "between", "among", "before", "after", "into", "near", "behind", "across", "around", "during", "without", "toward", "against"]);
  const BE_VERBS = new Set(["am", "is", "are", "was", "were", "be", "been", "being"]);
  const QUESTION_AUXILIARIES = new Set(["am", "is", "are", "was", "were", "do", "does", "did", "have", "has", "had", "can", "could", "will", "would", "should", "may", "might", "must"]);
  const TO_INFINITIVE_HEADS = new Set(["want", "wants", "wanted", "need", "needs", "needed", "hope", "hopes", "hoped", "plan", "plans", "planned", "try", "tries", "tried", "decide", "decides", "decided", "choose", "chooses", "chose", "learn", "learns", "learned", "ask", "asks", "asked", "tell", "tells", "told", "like", "likes", "liked", "love", "loves", "begin", "begins", "start", "starts"]);
  const GRAMMAR_EXPRESSIONS = [
    { phrase: "look for", meaning: "look for는 ‘~을 찾다’라는 숙어예요." },
    { phrase: "take care of", meaning: "take care of는 ‘~을 돌보다’라는 숙어예요." },
    { phrase: "be interested in", meaning: "be interested in은 ‘~에 관심이 있다’라는 표현이에요." },
    { phrase: "be good at", meaning: "be good at은 ‘~을 잘하다’라는 표현이에요." },
    { phrase: "have to", meaning: "have to는 ‘~해야 한다’라는 뜻이에요." },
    { phrase: "used to", meaning: "used to는 ‘예전에 ~하곤 했다’라는 뜻이에요." },
    { phrase: "because of", meaning: "because of는 ‘~때문에’라고 해석해요." },
    { phrase: "in order to", meaning: "in order to는 ‘~하기 위해’라고 해석해요." },
    { phrase: "at sunset", meaning: "at sunset은 ‘해 질 무렵에’라는 시간 표현이에요." },
    { phrase: "screen time", meaning: "screen time은 ‘화면을 사용하는 시간’을 뜻해요." }
  ];
  const VOICE_PRIORITY = [/^Samantha$/i, /^Ava(?:\s|$)/i, /^Google US English$/i, /Microsoft (Ava|Jenny|Aria|Guy).*Natural/i, /^Alex$/i, /^Daniel$/i, /^Karen$/i];
  const NOVELTY_VOICES = /Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Compact|Fred|Good News|Jester|Junior|Kathy|Organ|Ralph|Superstar|Trinoids|Whisper|Wobble|Zarvox/i;

  const $ = (selector) => document.querySelector(selector);
  const ui = {
    landing: $("#title-screen"),
    homework: $("#homework-screen"),
    study: $("#study-screen"),
    result: $("#result-screen"),
    pages: $("#sentence-pages"),
    pageDots: $("#page-dots"),
    pageLabel: $("#page-label"),
    sourceTitle: $("#source-title"),
    chapterLabel: $("#chapter-label"),
    progressCount: $("#progress-count"),
    progressBar: $("#study-progress-bar"),
    srLevel: $("#sr-level-label"),
    elapsed: $("#elapsed-time"),
    currentNumber: $("#current-sentence-number"),
    accuracy: $("#accuracy-label"),
    feedback: $("#live-feedback"),
    sound: $("#sound-toggle"),
    vocabList: $("#vocab-list"),
    bigNext: $("#big-next-button"),
    savedBooksPanel: $("#saved-books-panel"),
    savedBookList: $("#saved-book-list"),
    resultSource: $("#result-source"),
    resultSr: $("#result-sr"),
    resultTime: $("#result-time"),
    resultAverage: $("#result-average"),
    resultAccuracy: $("#result-accuracy"),
    toast: $("#study-toast")
  };

  const state = {
    stages: [],
    currentIndex: 0,
    pageIndex: 0,
    session: null,
    attempts: 0,
    mistakes: 0,
    sound: false,
    sourceTitle: "Lost Signal · Sample Text",
    srLevel: "2.5",
    startedAt: 0,
    elapsedSeconds: 0,
    timer: null,
    advanceTimer: null,
    locked: false
  };
  let effectAudioContext;
  let speechRetryTimer;
  let speechRequest = 0;

  bindUI();
  if (window.HomeworkBuilder) {
    window.HomeworkBuilder.init({
      onStart(stages, sourceMeta) {
        startStudy(stages, sourceMeta || {});
      }
    });
  }

  function bindUI() {
    const startButton = $("#start-button");
    if (startButton) startButton.addEventListener("click", () => startStudy(window.LOST_SIGNAL_STORY || [], {
      sourceTitle: "Lost Signal · Sample Text",
      srLevel: "2.5"
    }));
    $("#restart-button").addEventListener("click", () => startStudy(state.stages, {
      sourceTitle: state.sourceTitle,
      srLevel: state.srLevel
    }));
    $("#exit-study").addEventListener("click", showLanding);
    $("#home-button").addEventListener("click", showLanding);
    ui.savedBookList.addEventListener("click", handleSavedBookClick);
    ui.sound.addEventListener("click", () => {
      state.sound = !state.sound;
      ui.sound.textContent = state.sound ? "♫" : "×";
      ui.sound.setAttribute("aria-pressed", String(state.sound));
      if (!state.sound) stopSpeech();
      else if (state.session) speakActiveChunk();
      showToast(state.sound ? "문장 읽기 소리를 켰어요." : "문장 읽기 소리를 껐어요.");
    });
    ui.pages.addEventListener("click", handleBoardClick);
    initFontScale();
    ui.bigNext.addEventListener("click", () => {
      if (state.mode === "paragraph") {
        if (!state.paragraphs) return;
        playEffect("tap");
        if (state.paraPhase === "reading") {
          state.paraPhase = "summary";
          stopSpeech();
          renderParagraphs();
        } else if (state.paraIndex >= state.paragraphs.length - 1) {
          finishStudy();
        } else {
          state.paraIndex += 1;
          state.paraPhase = "reading";
          renderParagraphs();
          speakCurrentParagraph();
        }
        return;
      }
      if (!state.session) return;
      playEffect("tap");
      if (state.session.phase === "halves") { advanceReadingChunk(); return; }
      if (state.session.phase === "complete") advanceToNextSentence();
    });
    window.addEventListener("resize", () => requestAnimationFrame(alignQuizToActiveChunk));
    renderSavedBooks();
    syncBundledBooks().then(upgradeStoredBooksWithGemini);
    window.addEventListener("readinglab:books-changed", () => {
      renderSavedBooks();
      scheduleCloudPush();
    });
  }

  // 기기 간 책 동기화용 클라우드 저장소 (schedule-site와 같은 Supabase, 전용 행 사용)
  const CLOUD_KV = {
    url: "https://pidfkrxsgffoqstogmli.supabase.co/rest/v1/schedule_site_client_kv",
    key: "sb_publishable_0JHUt_yXZx78FwoqO8XCDg_s319cLiW",
    row: "reading_lab_books_v1"
  };
  let cloudDeleted = {};
  let cloudAvailable = false;
  let cloudPushTimer = 0;

  function bookKey(book) { return String((book && book.title) || "").trim().toLowerCase(); }
  function bookGlossCount(book) {
    return (Array.isArray(book && book.sentences) ? book.sentences : [])
      .reduce((sum, item) => sum + (Array.isArray(item.wordGlosses) ? item.wordGlosses.length : 0), 0);
  }
  function bookTime(book) {
    const time = Date.parse(String((book && book.savedAt) || ""));
    return Number.isFinite(time) ? time : 0;
  }
  function pickBetterBook(a, b) {
    if (!a) return b;
    if (!b) return a;
    const timeA = bookTime(a);
    const timeB = bookTime(b);
    if (timeA !== timeB) return timeA > timeB ? a : b; // 다시 만든 책이면 최신본 우선
    return bookGlossCount(b) > bookGlossCount(a) ? b : a; // 같은 판이면 단어 뜻 많은 쪽
  }

  async function fetchCloudBooks() {
    try {
      const response = await fetch(`${CLOUD_KV.url}?id=eq.${CLOUD_KV.row}&select=kv&limit=1`, {
        headers: { apikey: CLOUD_KV.key, Authorization: `Bearer ${CLOUD_KV.key}` },
        cache: "no-store"
      });
      if (!response.ok) return null;
      const rows = await response.json();
      const kv = rows && rows[0] && rows[0].kv;
      return {
        books: Array.isArray(kv && kv.books) ? kv.books : [],
        deleted: (kv && typeof kv.deleted === "object" && kv.deleted) || {}
      };
    } catch (_) {
      return null;
    }
  }

  async function pushBooksToCloud() {
    if (!cloudAvailable) return;
    const books = getStoredBooks();
    if (!books.length && !Object.keys(cloudDeleted).length) return; // 빈값 덮어쓰기 가드
    try {
      await fetch(`${CLOUD_KV.url}?on_conflict=id`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
          apikey: CLOUD_KV.key,
          Authorization: `Bearer ${CLOUD_KV.key}`
        },
        body: JSON.stringify([{ id: CLOUD_KV.row, kv: { books, deleted: cloudDeleted } }])
      });
    } catch (_) { /* 오프라인이면 다음 열 때 다시 올린다 */ }
  }

  function scheduleCloudPush() {
    clearTimeout(cloudPushTimer);
    cloudPushTimer = setTimeout(pushBooksToCloud, 2500);
  }

  async function syncBundledBooks() {
    // 내장 책(books.json) + 클라우드 책 + 이 기기 책을 제목 기준으로 병합한다
    let bundled = [];
    try {
      const response = await fetch("books.json", { cache: "no-cache" });
      if (response.ok) {
        const parsed = await response.json();
        if (Array.isArray(parsed)) bundled = parsed;
      }
    } catch (_) { /* offline or no bundled books */ }
    const cloud = await fetchCloudBooks();
    if (cloud) {
      cloudAvailable = true;
      cloudDeleted = cloud.deleted;
    }
    const merged = new Map();
    const consider = (book) => {
      if (!book || !Array.isArray(book.sentences) || !book.sentences.length) return;
      const key = bookKey(book);
      if (!key) return;
      merged.set(key, pickBetterBook(merged.get(key), book));
    };
    getStoredBooks().forEach(consider);
    bundled.forEach(consider);
    (cloud ? cloud.books : []).forEach(consider);
    // 다른 기기에서 지운 책은 빼되, 삭제 후 다시 만든 책은 살린다
    Object.entries(cloudDeleted).forEach(([key, deletedAt]) => {
      const book = merged.get(key);
      if (!book) return;
      if (bookTime(book) > (Date.parse(String(deletedAt)) || 0)) {
        delete cloudDeleted[key];
        return;
      }
      merged.delete(key);
    });
    const books = [...merged.values()].sort((a, b) => bookTime(b) - bookTime(a)).slice(0, 20);
    try {
      localStorage.setItem("lostSignalHomeworkBooks", JSON.stringify(books));
      if (books.length) localStorage.setItem("lostSignalHomeworkBook", JSON.stringify(books[0]));
    } catch (_) { /* local storage may be unavailable */ }
    renderSavedBooks();
    scheduleCloudPush();
    // 로컬 개발 서버에서는 이 기기의 책을 프로젝트 books.json으로 백업한다
    try {
      if (/^(127\.0\.0\.1|localhost)$/.test(location.hostname) && books.length) {
        await fetch("/api/books/backup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(books)
        });
      }
    } catch (_) { /* local server may not support backup */ }
  }

  function getStoredBooks() {
    try {
      const list = JSON.parse(localStorage.getItem("lostSignalHomeworkBooks") || "null");
      if (Array.isArray(list)) return list.filter((book) => book && Array.isArray(book.sentences));
      const legacy = JSON.parse(localStorage.getItem("lostSignalHomeworkBook") || "null");
      return legacy && Array.isArray(legacy.sentences) ? [legacy] : [];
    } catch (_) {
      return [];
    }
  }

  function renderSavedBooks() {
    const books = getStoredBooks();
    ui.savedBooksPanel.hidden = books.length === 0;
    ui.savedBookList.innerHTML = books.map((book, index) => `<div class="saved-book-card">
      <button class="saved-book-card__start" type="button" data-saved-book-index="${index}"><span class="saved-book-card__art" aria-hidden="true">📖</span><span class="saved-book-card__copy"><strong>${escapeHtml(book.title || "이름 없는 책")}</strong><small>${book.sentences.length}문장 · 저장한 책</small></span><b class="saved-book-card__arrow">→</b></button>
      <button class="saved-book-card__delete" type="button" data-delete-book-index="${index}" aria-label="${escapeHtml(book.title || "이름 없는 책")} 삭제">×</button>
    </div>`).join("");
  }

  async function upgradeStoredBooksWithGemini() {
    let apiKey = "";
    try { apiKey = window.getGeminiKey(); } catch (_) { /* storage may be unavailable */ }
    if (!apiKey) return;
    const books = getStoredBooks();
    const pending = [];
    books.forEach((book) => book.sentences.forEach((sentence) => {
      if (Number(sentence.geminiStudyVersion || 0) < 2) pending.push(sentence);
    }));
    if (!pending.length) return;
    showToast(`기존 책의 ${pending.length}개 문장을 Gemini로 업데이트하고 있어요.`);
    let updated = 0;
    for (const sentence of pending) {
      try {
        const result = await window.geminiAnalyze({ mode: "sentence", apiKey, sentence: sentence.sentence });
        const analyzed = Array.isArray(result.sentences) ? result.sentences[0] : null;
        if (!analyzed) throw new Error("문장을 업데이트하지 못했습니다.");
        Object.assign(sentence, analyzed, { geminiStudyVersion: 2 });
        updated += 1;
      } catch (_) { /* leave this sentence for the next retry */ }
    }
    try {
      localStorage.setItem("lostSignalHomeworkBooks", JSON.stringify(books));
      if (books.length) localStorage.setItem("lostSignalHomeworkBook", JSON.stringify(books[0]));
    } catch (_) { /* local storage may be unavailable */ }
    renderSavedBooks();
    if (updated) scheduleCloudPush();
    showToast(updated ? `기존 책의 ${updated}개 문장을 Gemini로 업데이트했습니다.` : "기존 책 업데이트를 완료하지 못했어요. Gemini 키를 확인해주세요.");
  }

  function handleSavedBookClick(event) {
    const deleteButton = event.target.closest("[data-delete-book-index]");
    if (deleteButton) {
      const books = getStoredBooks();
      const index = Number(deleteButton.dataset.deleteBookIndex);
      const book = books[index];
      if (!book || !window.confirm(`‘${book.title || "이름 없는 책"}’을 삭제할까요?`)) return;
      books.splice(index, 1);
      try {
        localStorage.setItem("lostSignalHomeworkBooks", JSON.stringify(books));
        if (books.length) localStorage.setItem("lostSignalHomeworkBook", JSON.stringify(books[0]));
        else localStorage.removeItem("lostSignalHomeworkBook");
      } catch (_) { /* local storage may be unavailable */ }
      cloudDeleted[bookKey(book)] = new Date().toISOString();
      scheduleCloudPush();
      renderSavedBooks();
      return;
    }
    const button = event.target.closest("[data-saved-book-index]");
    if (!button) return;
    const books = getStoredBooks();
    const book = books[Number(button.dataset.savedBookIndex)];
    if (!book || !Array.isArray(book.sentences) || !book.sentences.length) return;
    startStudy(book.sentences, { sourceTitle: book.title, srLevel: book.srLevel || "직접 입력" });
  }

  function startStudy(stages, sourceMeta) {
    if (!Array.isArray(stages) || !stages.length) return;
    clearTimeout(state.advanceTimer);
    clearInterval(state.timer);
    stopSpeech();
    state.stages = stages.map((stage, index) => normalizeStage(stage, index));
    state.currentIndex = 0;
    state.pageIndex = 0;
    state.session = null;
    state.attempts = 0;
    state.mistakes = 0;
    state.locked = false;
    state.sourceTitle = String(sourceMeta.sourceTitle || sourceMeta.title || state.stages[0].sourceTitle || "My Reading Text").trim();
    state.srLevel = formatSr(sourceMeta.srLevel || sourceMeta.sr || state.stages[0].srLevel || "직접 입력");
    state.startedAt = Date.now();
    state.elapsedSeconds = 0;
    ui.landing.classList.remove("is-visible");
    ui.homework.classList.remove("is-visible");
    ui.homework.setAttribute("aria-hidden", "true");
    ui.study.hidden = false;
    ui.result.hidden = true;
    ui.sourceTitle.textContent = state.sourceTitle;
    ui.srLevel.textContent = `SR ${state.srLevel}`;
    ui.chapterLabel.textContent = "CHAPTER 1";
    ui.elapsed.textContent = "00:00";
    state.mode = "paragraph";
    updateStats();
    initParagraphs();
    state.timer = setInterval(updateTimer, 1000);
    prefetchWordGlosses();
  }

  function initFontScale() {
    // 글씨 크기 조절: 한 번 정하면 이 기기에 저장되어 계속 유지된다
    const KEY = "readingLabFontScale";
    let scale = 1;
    try { scale = Math.min(1.8, Math.max(0.6, parseFloat(localStorage.getItem(KEY)) || 1)); } catch (_) { /* ignore */ }
    const label = $("#font-scale-label");
    const apply = () => {
      document.documentElement.style.setProperty("--para-scale", String(scale));
      if (label) label.textContent = `${Math.round(scale * 100)}%`;
      try { localStorage.setItem(KEY, String(scale)); } catch (_) { /* ignore */ }
    };
    const step = (delta) => { scale = Math.min(1.8, Math.max(0.6, Math.round((scale + delta) * 10) / 10)); apply(); };
    const smaller = $("#font-smaller");
    const larger = $("#font-larger");
    if (smaller) smaller.addEventListener("click", () => step(-0.1));
    if (larger) larger.addEventListener("click", () => step(0.1));
    apply();
  }

  function findCurrentBook() {
    const title = String(state.sourceTitle || "").trim().toLowerCase();
    return getStoredBooks().find((book) => String(book.title || "").trim().toLowerCase() === title) || null;
  }

  function fallbackParagraphs() {
    const paragraphs = [];
    for (let start = 0; start < state.stages.length; start += 4) {
      paragraphs.push({ start, end: Math.min(start + 3, state.stages.length - 1), summary: "" });
    }
    return paragraphs;
  }

  function normalizeParagraphs(raw) {
    const total = state.stages.length;
    const cleaned = (Array.isArray(raw) ? raw : [])
      .map((item) => ({
        start: Number(item.start != null ? item.start : item.startIndex),
        end: Number(item.end != null ? item.end : item.endIndex),
        summary: String(item.summary || "").trim()
      }))
      .filter((item) => Number.isFinite(item.start) && Number.isFinite(item.end) && item.start <= item.end)
      .sort((a, b) => a.start - b.start);
    if (!cleaned.length) return [];
    // 빠짐·겹침 없이 전체 문장을 덮도록 보정
    let expected = 0;
    const paragraphs = [];
    cleaned.forEach((item) => {
      if (expected >= total) return;
      const start = expected;
      const end = Math.max(start, Math.min(total - 1, item.end));
      paragraphs.push({ start, end, summary: item.summary });
      expected = end + 1;
    });
    if (expected <= total - 1 && paragraphs.length) paragraphs[paragraphs.length - 1].end = total - 1;
    return paragraphs;
  }

  function initParagraphs() {
    state.paraIndex = 0;
    state.paraPhase = "reading";
    const book = findCurrentBook();
    const saved = book && Array.isArray(book.paragraphs) ? normalizeParagraphs(book.paragraphs) : [];
    state.paragraphs = saved.length ? saved : fallbackParagraphs();
    renderParagraphs();
    speakCurrentParagraph();
    if (!saved.length) refreshParagraphsFromGemini(book);
  }

  async function refreshParagraphsFromGemini(book) {
    const apiKey = window.getGeminiKey();
    if (!apiKey) return;
    const stages = state.stages;
    try {
      const result = await window.geminiAnalyze({ mode: "paragraphs", apiKey, sentences: stages.map((stage) => stage.sentence) });
      if (state.stages !== stages) return;
      const paragraphs = normalizeParagraphs(result && result.paragraphs);
      if (!paragraphs.length) return;
      if (book) {
        try {
          const books = getStoredBooks();
          const match = books.find((item) => String(item.title || "").trim().toLowerCase() === String(book.title || "").trim().toLowerCase());
          if (match) {
            match.paragraphs = paragraphs;
            localStorage.setItem("lostSignalHomeworkBooks", JSON.stringify(books));
            scheduleCloudPush();
          }
        } catch (_) { /* local storage may be unavailable */ }
      }
      // 아직 첫 문단을 읽는 중일 때만 화면을 새 문단 구성으로 바꾼다
      if (state.mode === "paragraph" && state.paraIndex === 0 && state.paraPhase === "reading") {
        state.paragraphs = paragraphs;
        renderParagraphs();
      }
    } catch (_) { /* 문단 나누기는 실패해도 4문장 묶음으로 계속 */ }
  }

  function currentParagraph() {
    return (state.paragraphs && state.paragraphs[state.paraIndex]) || null;
  }

  function paragraphSummaryText(para) {
    if (para.summary) return para.summary;
    return state.stages.slice(para.start, para.end + 1)
      .map((stage) => String(stage.translation || "").trim()).filter(Boolean).join(" ");
  }

  function hardestParagraphWords(para, limit) {
    // 문단에서 가장 어려운 단어만 고른다: 흔한 단어 사전에 없는 것 우선, 그다음 긴 단어
    const candidates = new Map();
    state.stages.slice(para.start, para.end + 1).forEach((stage) => {
      (Array.isArray(stage.wordGlosses) ? stage.wordGlosses : []).forEach((item) => {
        const lower = String(item.word || "").toLowerCase();
        const meaning = String(item.meaning || "").trim();
        if (!lower || !meaning || EASY_WORDS.has(lower) || lower.length <= 3) return;
        if (!candidates.has(lower)) candidates.set(lower, meaning);
      });
    });
    const known = window.HomeworkBuilder && typeof window.HomeworkBuilder.vocabularyMeaning === "function"
      ? window.HomeworkBuilder.vocabularyMeaning : () => "";
    return new Map([...candidates.entries()]
      .sort((a, b) => ((known(a[0]) ? 0 : 100) + a[0].length) < ((known(b[0]) ? 0 : 100) + b[0].length) ? 1 : -1)
      .slice(0, limit));
  }

  function renderParagraphSentence(stage, stageIndex, isActive, allowedGlosses) {
    const verbTargets = new Set(getVerbTargetIndices(stage));
    return tokenize(stage.sentence).map((token, tokenIndex) => {
      if (!/[A-Za-z]/.test(token)) return `<span class="para-token is-punct">${escapeHtml(token)}</span>`;
      const verbClass = isActive && verbTargets.has(tokenIndex) ? " is-verb" : "";
      if (!isActive) return `<span class="para-token">${escapeHtml(token)}</span>`;
      const lower = token.toLowerCase();
      const gloss = allowedGlosses ? allowedGlosses.get(lower) : null;
      if (gloss) allowedGlosses.delete(lower); // 같은 단어는 문단에서 처음 한 번만 표기
      return `<button type="button" class="para-token is-word${verbClass}${gloss ? " has-gloss" : ""}" data-word="${escapeHtml(token)}" data-si="${stageIndex}">${escapeHtml(token)}${gloss ? `<small>${escapeHtml(gloss)}</small>` : ""}</button>`;
    }).join(" ").replace(/ (<span class="para-token is-punct">)/g, "$1"); // 구두점 앞 공백 제거(책 조판처럼)
  }

  function renderParagraphs() {
    renderVocabPanel();
    if (!state.paragraphs) return;
    const cards = state.paragraphs.map((para, pIndex) => {
      const isActive = pIndex === state.paraIndex;
      const cls = isActive ? "is-active" : pIndex < state.paraIndex ? "is-done" : "is-queued";
      const allowedGlosses = isActive ? hardestParagraphWords(para, 3) : null;
      const text = state.stages.slice(para.start, para.end + 1)
        .map((stage, offset) => renderParagraphSentence(stage, para.start + offset, isActive, allowedGlosses)).join(" ");
      const showSummary = pIndex < state.paraIndex || (isActive && state.paraPhase === "summary");
      const summary = showSummary ? paragraphSummaryText(para) : "";
      return `<article class="para-card ${cls}" data-para-index="${pIndex}">
        <div class="para-label"><span>PARAGRAPH ${String(pIndex + 1).padStart(2, "0")}</span></div>
        <p class="para-text">${text}</p>
        ${summary ? `<div class="para-summary"><span>이 문단의 내용</span><p>${escapeHtml(summary)}</p></div>` : ""}
      </article>`;
    }).join("");
    ui.pages.innerHTML = `<section class="para-list" aria-label="문단 학습 목록">${cards}</section>`;
    ui.pages.style.transform = "none";
    ui.pageLabel.textContent = `PARAGRAPH ${String(state.paraIndex + 1).padStart(2, "0")} · ${state.paragraphs.length}`;
    const total = state.paragraphs.length;
    const done = state.paraIndex + (state.paraPhase === "summary" ? 1 : 0);
    ui.progressCount.textContent = `${Math.min(done, total)} / ${total}`;
    ui.progressBar.style.width = `${(Math.min(done, total) / total) * 100}%`;
    ui.currentNumber.textContent = String(state.paraIndex + 1).padStart(2, "0");
    const dotCount = Math.min(7, total);
    const dotStart = Math.max(0, Math.min(state.paraIndex - 3, total - dotCount));
    ui.pageDots.innerHTML = state.paragraphs.slice(dotStart, dotStart + dotCount).map((_, offset) => {
      const index = dotStart + offset;
      return `<i class="${index === state.paraIndex ? "is-current" : index < state.paraIndex ? "is-done" : ""}"></i>`;
    }).join("");
    const active = ui.pages.querySelector(".para-card.is-active");
    if (active) requestAnimationFrame(() => active.scrollIntoView({ block: "start", behavior: "smooth" }));
  }

  function speakCurrentParagraph() {
    const para = currentParagraph();
    if (!para) return;
    speakSentence(state.stages.slice(para.start, para.end + 1).map((stage) => stage.sentence).join(" "));
  }

  async function showParagraphWordMeaning(button) {
    if (button.classList.contains("has-gloss") || button.classList.contains("is-loading")) return;
    const word = button.dataset.word || "";
    const stage = state.stages[Number(button.dataset.si)];
    if (!word || !stage) return;
    const lower = word.toLowerCase();
    const glossary = (Array.isArray(stage.wordGlosses) ? stage.wordGlosses : [])
      .find((item) => String(item.word || "").toLowerCase() === lower);
    const localMeaning = window.HomeworkBuilder && typeof window.HomeworkBuilder.vocabularyMeaning === "function"
      ? window.HomeworkBuilder.vocabularyMeaning(lower) : "";
    let meaning = String((glossary && glossary.meaning) || localMeaning || "").trim();
    if (!meaning) {
      button.classList.add("is-loading");
      button.insertAdjacentHTML("beforeend", "<small>…</small>");
      try {
        const result = await window.geminiAnalyze({ mode: "word", apiKey: window.getGeminiKey(), word, sentence: stage.sentence });
        meaning = String((result && result.meaning) || "").trim();
      } catch (_) { meaning = ""; }
      button.classList.remove("is-loading");
      const loading = button.querySelector("small");
      if (loading) loading.remove();
      if (meaning) {
        if (!Array.isArray(stage.wordGlosses)) stage.wordGlosses = [];
        stage.wordGlosses.push({ word, meaning });
        saveWordGlossToBook(stage.sentence, word, meaning);
      }
    }
    if (!meaning) { showToast("뜻을 찾지 못했어요. 다시 눌러보세요."); return; }
    button.classList.add("has-gloss");
    if (!button.querySelector("small")) button.insertAdjacentHTML("beforeend", `<small>${escapeHtml(meaning)}</small>`);
  }

  async function prefetchWordGlosses() {
    // 세션 시작과 동시에 모든 단어 뜻을 미리 받아둬서 클릭 즉시 보이게 한다
    try {
      const apiKey = window.getGeminiKey();
      if (!apiKey || !Array.isArray(state.stages) || !state.stages.length) return;
      const stages = state.stages;
      const known = new Set();
      stages.forEach((stage) => (Array.isArray(stage.wordGlosses) ? stage.wordGlosses : [])
        .forEach((item) => known.add(String(item.word || "").toLowerCase())));
      const wanted = [];
      stages.forEach((stage) => tokenize(stage.sentence).forEach((token) => {
        if (!/[A-Za-z]/.test(token)) return;
        const lower = token.toLowerCase();
        if (known.has(lower)) return;
        if (window.HomeworkBuilder && typeof window.HomeworkBuilder.vocabularyMeaning === "function"
          && window.HomeworkBuilder.vocabularyMeaning(lower)) return;
        known.add(lower);
        wanted.push(token);
      }));
      if (!wanted.length) return;
      const passage = stages.map((stage) => stage.sentence).join(" ");
      for (let start = 0; start < wanted.length; start += 80) {
        const batch = wanted.slice(start, start + 80);
        const result = await window.geminiAnalyze({ mode: "words", apiKey, words: batch, passage });
        const glosses = Array.isArray(result && result.glosses) ? result.glosses : [];
        if (state.stages !== stages) return; // 다른 세션으로 넘어갔으면 중단
        glosses.forEach((item) => {
          const word = String(item && item.word || "").trim();
          const meaning = String(item && item.meaning || "").trim();
          if (!word || !meaning) return;
          const lower = word.toLowerCase();
          stages.forEach((stage) => {
            if (!tokenize(stage.sentence).some((token) => token.toLowerCase() === lower)) return;
            if (!Array.isArray(stage.wordGlosses)) stage.wordGlosses = [];
            if (stage.wordGlosses.some((entry) => String(entry.word || "").toLowerCase() === lower)) return;
            stage.wordGlosses.push({ word, meaning });
            saveWordGlossToBook(stage.sentence, word, meaning);
          });
        });
        if (state.mode === "paragraph") renderParagraphs();
        else renderVocabPanel();
      }
    } catch (_) { /* 미리 받아두기는 실패해도 클릭 시 개별 조회로 동작한다 */ }
  }

  function normalizeStage(stage, index) {
    const sentence = String(stage.sentence || "").trim();
    const storedVerbs = Array.isArray(stage.verbs) ? stage.verbs.map((verb) => String(verb || "").trim()).filter(Boolean) : [];
    const verbs = storedVerbs.length ? storedVerbs : inferLegacyClauseVerbs(sentence, stage.verb);
    const verbOptions = validOptions(stage.verbOptions, stage.verbMeaning, ["가다", "보다", "기다리다", "생각하다"]);
    const prepOptions = stage.preposition ? validOptions(stage.prepositionOptions, stage.prepositionMeaning, ["~위에", "~로부터", "~와 함께", "~을 위해"]) : [];
    return {
      ...stage,
      sentence,
      sentenceMeaning: String(stage.sentenceMeaning || stage.translation || "뜻을 입력해주세요.").trim(),
      verb: String(stage.verb || "").trim(),
      verbs: verbs.length ? verbs : [String(stage.verb || "").trim()].filter(Boolean),
      verbMeaning: String(stage.verbMeaning || "동사 뜻").trim(),
      verbOptions,
      verbCorrect: verbOptions.indexOf(String(stage.verbMeaning || "동사 뜻").trim()),
      preposition: String(stage.preposition || "").trim(),
      prepositionMeaning: String(stage.prepositionMeaning || "").trim(),
      prepositionOptions: prepOptions,
      prepositionCorrect: prepOptions.indexOf(String(stage.prepositionMeaning || "").trim()),
      sentenceOptions: Array.isArray(stage.sentenceOptions) ? stage.sentenceOptions.map((option) => String(option || "").trim()).filter(Boolean).slice(0, 4) : [],
      sourceTitle: stage.sourceTitle || "",
      srLevel: stage.srLevel || "",
      studyNumber: index + 1
    };
  }

  function inferLegacyClauseVerbs(sentence, primaryVerb) {
    const tokens = tokenize(sentence);
    const ignoredPlurals = new Set(["weeks", "days", "eggs", "lights", "faces", "muscles", "lungs", "wastes", "things", "times"]);
    const subjectHeads = new Set(["a", "an", "the", "this", "that", "these", "those", "i", "you", "he", "she", "it", "we", "they", "who", "which", "when"]);
    const isFiniteCandidate = (word) => BE_VERBS.has(word) || (!ignoredPlurals.has(word) && /(?:s|ed)$/.test(word));
    const segments = [];
    let segment = [];
    tokens.forEach((token, index) => {
      if (token === "," || token === ";") {
        if (segment.length) segments.push(segment);
        segment = [];
      } else if (/[A-Za-z]/.test(token)) {
        segment.push({ word: token, index });
      }
    });
    if (segment.length) segments.push(segment);
    const primary = String(primaryVerb || "").toLowerCase();
    const found = [];
    segments.forEach((words) => {
      let match = words.find((item) => item.word.toLowerCase() === primary);
      if (!match) {
        const subjectIndex = words.findIndex((item) => subjectHeads.has(item.word.toLowerCase()));
        const search = subjectIndex >= 0 ? words.slice(subjectIndex + 1) : words;
        match = search.find((item) => isFiniteCandidate(item.word.toLowerCase()));
      }
      if (match) found.push(match.word);
    });
    if (!found.length && primaryVerb) found.push(String(primaryVerb));
    return found;
  }

  function validOptions(provided, correct, fallback) {
    const original = [];
    (Array.isArray(provided) ? provided : []).forEach((value) => {
      const cleaned = String(value || "").trim();
      if (cleaned && !original.includes(cleaned)) original.push(cleaned);
    });
    if (original.length >= 4 && original.includes(String(correct || "").trim())) return original.slice(0, 4);
    const values = [];
    [correct, ...original, ...fallback].forEach((value) => {
      const cleaned = String(value || "").trim();
      if (cleaned && !values.includes(cleaned)) values.push(cleaned);
    });
    return values.slice(0, 4);
  }

  function activateSentence(index) {
    const stage = state.stages[index];
    if (!stage) return finishStudy();
    const grammar = analyzeGrammar(stage);
    const meaningHalves = getMeaningHalves(stage, grammar);
    const verbTargetIndices = getVerbTargetIndices(stage);
    const idiomRanges = getIdiomRanges(stage);
    state.currentIndex = index;
    state.pageIndex = Math.floor(index / PAGE_SIZE);
    state.session = {
      phase: "halves",
      grammar,
      meaningHalves,
      verbTargetIndices,
      foundVerbIndices: verbTargetIndices.slice(),
      idiomRanges,
      selectedWordIndex: -1,
      selectedTerm: "",
      selectedWordMeaning: "",
      revealed: meaningHalves.map(() => false),
      halfIndex: 0,
      completed: false,
      startedAt: Date.now()
    };
    state.locked = false;
    renderPages();
    updateStats();
    updateLegend();
    speakActiveChunk();
  }

  function speakActiveChunk() {
    if (state.mode === "paragraph") { speakCurrentParagraph(); return; }
    if (!state.session) return;
    const stage = state.stages[state.currentIndex];
    if (!stage) return;
    const part = state.session.phase === "halves" ? state.session.meaningHalves[state.session.halfIndex] : null;
    speakSentence(part && part.text ? part.text : stage.sentence);
  }

  const EASY_WORDS = new Set(("a an the this that these those i you he she it we they me him her us them my your his its our " +
    "their and but or so because if when while who what where why how not no yes very more most some any all each every " +
    "one two three first also just too then than there here now am is are was were be been being do does did have has had " +
    "will would can could may might must should shall of in on at to for with by from as about into over under up down " +
    "out off get got go goes went come came see saw look make made take took give gave say said tell told good bad big " +
    "small new old day time way thing boy girl man men woman it's don't isn't i'm he's she's they're we're you're").split(" "));

  function renderVocabPanel() {
    if (!ui.vocabList) return;
    let scopeStages = [];
    if (state.mode === "paragraph") {
      const para = currentParagraph();
      if (para) scopeStages = state.stages.slice(para.start, para.end + 1);
    } else if (state.session) {
      scopeStages = [state.stages[state.currentIndex]];
    }
    if (!scopeStages.length) { ui.vocabList.innerHTML = ""; return; }
    const items = [];
    const seen = new Set();
    scopeStages.forEach((stage) => {
    (Array.isArray(stage.idioms) ? stage.idioms : []).forEach((idiom) => {
      const phrase = String((idiom && idiom.phrase) || "").trim();
      const meaning = String((idiom && idiom.meaning) || "").trim();
      if (!phrase || !meaning || seen.has(phrase.toLowerCase())) return;
      seen.add(phrase.toLowerCase());
      items.push({ kind: "숙어", term: phrase, meaning });
    });
    const sentenceTokens = new Set(tokenize(stage.sentence).map((token) => token.toLowerCase()));
    (Array.isArray(stage.wordGlosses) ? stage.wordGlosses : []).forEach((entry) => {
      const word = String((entry && entry.word) || "").trim();
      const meaning = String((entry && entry.meaning) || "").trim();
      const lower = word.toLowerCase();
      if (!word || !meaning || seen.has(lower)) return;
      if (!sentenceTokens.has(lower)) return;
      if (EASY_WORDS.has(lower) || lower.length <= 2) return;
      seen.add(lower);
      items.push({ kind: "단어", term: word, meaning });
    });
    });
    ui.vocabList.innerHTML = items.slice(0, 20).map((entry) =>
      `<li class="${entry.kind === "숙어" ? "is-idiom" : ""}"><i>${entry.kind}</i><b>${escapeHtml(entry.term)}</b><span>${escapeHtml(entry.meaning)}</span></li>`
    ).join("") || `<li class="vocab-empty">이 문장에는 따로 익힐 단어가 없어요.</li>`;
  }

  function renderPages() {
    renderVocabPanel();
    const cards = state.stages.map((_, index) => renderSentenceCard(index));
    ui.pages.innerHTML = `<section class="sentence-page" aria-label="현재 문장 중심 학습 목록">${cards.join("")}</section>`;
    ui.pages.style.transform = "none";
    requestAnimationFrame(alignQuizToActiveChunk);
    ui.pageLabel.textContent = `SENTENCE ${String(state.currentIndex + 1).padStart(2, "0")} · ${state.stages.length}`;
    const dotCount = Math.min(7, state.stages.length);
    const dotStart = Math.max(0, Math.min(state.currentIndex - 3, state.stages.length - dotCount));
    ui.pageDots.innerHTML = state.stages.slice(dotStart, dotStart + dotCount).map((_, offset) => {
      const index = dotStart + offset;
      return `<i class="${index === state.currentIndex ? "is-current" : index < state.currentIndex ? "is-done" : ""}"></i>`;
    }).join("");
  }

  function alignQuizToActiveChunk() {
    if (!state.session || state.session.phase !== "halves") return;
    const work = ui.pages.querySelector(".sentence-card.is-active .sentence-card__work");
    const target = ui.pages.querySelector(".sentence-card.is-active .word-token.is-chunk-active:not(.is-punctuation)");
    const quiz = ui.pages.querySelector(".sentence-card.is-active .active-quiz");
    const alignedContent = quiz && (quiz.querySelector(".quiz-option span") || quiz.querySelector(".chunk-next-button"));
    if (!work || !target || !quiz || !alignedContent) return;
    const workLeft = work.getBoundingClientRect().left;
    const targetLeft = target.getBoundingClientRect().left;
    const optionTextInset = alignedContent.getBoundingClientRect().left - quiz.getBoundingClientRect().left;
    const margin = Math.max(0, Math.min(work.clientWidth * .68, targetLeft - workLeft - optionTextInset));
    quiz.style.marginLeft = `${Math.round(margin)}px`;
    quiz.style.width = `calc(100% - ${Math.round(margin)}px)`;
    requestAnimationFrame(() => {
      if (!quiz.isConnected || !target.isConnected || !alignedContent.isConnected) return;
      const actualTextLeft = alignedContent.getBoundingClientRect().left;
      const actualTargetLeft = target.getBoundingClientRect().left;
      const correction = actualTargetLeft - actualTextLeft;
      const correctedMargin = Math.max(0, Math.min(work.clientWidth * .82, margin + correction));
      quiz.style.marginLeft = `${Math.round(correctedMargin)}px`;
      quiz.style.width = `calc(100% - ${Math.round(correctedMargin)}px)`;
    });
  }

  function renderSentenceCard(index) {
    const stage = state.stages[index];
    const isComplete = index < state.currentIndex;
    const isActive = index === state.currentIndex;
    const isReview = isActive && state.session && state.session.phase === "complete";
    const isSentenceChoice = isActive && state.session && state.session.phase === "sentence";
    const className = isComplete ? "is-complete" : isActive ? `is-active${isReview ? " is-review" : ""}${isSentenceChoice ? " is-sentence-choice" : ""}` : "is-queued";
    const cardTitle = isActive ? activeInstructionTitle() : stage.sentence;
    const summary = isComplete ? stage.sentenceMeaning : isActive ? phaseSummary() : "앞 문장을 완료하면 시작됩니다.";
    const stateLabel = isComplete ? "완료" : isActive ? activeStateLabel() : "대기";
    if (isComplete) return renderCompletedSentence(stage, index);
    return `<article class="sentence-card ${className}${isActive ? " is-minimal-question" : ""}" data-sentence-index="${index}">
      ${isActive ? "" : `<div class="sentence-card__summary">
        <div class="sentence-summary-copy"><strong>${escapeHtml(cardTitle)}</strong><small>${escapeHtml(summary)}</small></div>
        <div class="sentence-summary-actions">
          <span class="sentence-state">${stateLabel}</span>
        </div>
      </div>`}
      ${isActive ? renderActiveWork(stage) : ""}
    </article>`;
  }

  function renderCompletedSentence(stage, index) {
    const verbTargets = new Set(getVerbTargetIndices(stage));
    const idiomTargets = new Set(getIdiomRanges(stage).flatMap((range) => Array.from({ length: range.end - range.start + 1 }, (_, offset) => range.start + offset)));
    const tokens = tokenize(stage.sentence).map((token, tokenIndex) => {
      const punctuation = !/[A-Za-z]/.test(token);
      return `<span class="word-token${punctuation ? " is-punctuation" : ""}${verbTargets.has(tokenIndex) ? " is-verb" : ""}${idiomTargets.has(tokenIndex) ? " is-idiom" : ""}">${escapeHtml(token)}</span>`;
    }).join("");
    return `<article class="sentence-card is-complete is-expanded-complete" data-sentence-index="${index}">
      <div class="completed-sentence-body">
        <div class="fixed-sentence" aria-label="완료한 영어 문장">${tokens}</div>
      </div>
    </article>`;
  }

  function renderPlaceholder() {
    return `<div class="sentence-card is-placeholder" aria-hidden="true"></div>`;
  }

  function renderActiveWork(stage) {
    const parts = state.session.meaningHalves;
    const activeIndex = state.session.halfIndex;
    const wordCount = (text) => (String(text || "").match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || []).length;
    const totalWords = Math.max(1, parts.reduce((sum, part) => sum + wordCount(part.text), 0));
    const precedingWords = parts.slice(0, activeIndex).reduce((sum, part) => sum + wordCount(part.text), 0);
    const chunkOffset = state.session.phase === "halves" ? Math.min(68, Math.round((precedingWords / totalWords) * 100)) : 0;
    return `<div class="sentence-card__work">
      <div class="sentence-focus-line">
        <div class="stable-sentence-anchor">
          <div class="fixed-sentence" role="group" aria-label="현재 영어 문장">${renderTokens(stage)}</div>
          ${state.session.selectedWordIndex >= 0 ? `<div class="clicked-word-meaning"><b>${escapeHtml(state.session.selectedTerm || tokenize(stage.sentence)[state.session.selectedWordIndex] || "")}</b><span>${escapeHtml(state.session.selectedWordMeaning)}</span></div>` : ""}
        </div>
      </div>
      <div class="active-quiz" style="--chunk-offset:${chunkOffset}%">${renderQuiz(stage)}</div>
    </div>`;
  }

  function renderTokens(stage) {
    const tokens = tokenize(stage.sentence);
    const wordPhase = state.session.phase === "verb";
    const chunkRange = state.session.phase === "halves" ? getActiveChunkRange(stage) : null;
    return tokens.map((token, index) => {
      const punctuation = !/[A-Za-z]/.test(token);
      const verbClass = state.session.foundVerbIndices.includes(index) ? " is-verb" : "";
      const chunkClass = chunkRange
        ? (index >= chunkRange.start && index <= chunkRange.end
          ? ` is-chunk-active${index === chunkRange.start ? " is-chunk-start" : ""}${index === chunkRange.end ? " is-chunk-end" : ""}`
          : " is-chunk-muted")
        : "";
      const selectedClass = state.session.selectedWordIndex === index ? " is-word-selected" : "";
      const idiomClass = state.session.idiomRanges.some((range) => index >= range.start && index <= range.end) ? " is-idiom" : "";
      const disabled = punctuation || state.locked;
      return `<button class="word-token${punctuation ? " is-punctuation" : ""}${verbClass}${idiomClass}${chunkClass}${selectedClass}" type="button" data-word-index="${index}" ${disabled ? "disabled" : ""}>${escapeHtml(token)}</button>`;
    }).join("");
  }

  function getActiveChunkRange(stage) {
    const part = state.session.meaningHalves[state.session.halfIndex];
    if (!part) return null;
    const sentenceTokens = tokenize(stage.sentence);
    const sentenceWords = sentenceTokens.map((token, index) => ({ token: token.toLowerCase(), index })).filter((item) => /[a-z]/.test(item.token));
    const partWords = tokenize(part.text).map((token) => token.toLowerCase()).filter((token) => /[a-z]/.test(token));
    if (!partWords.length) return null;
    for (let start = 0; start <= sentenceWords.length - partWords.length; start += 1) {
      const matches = partWords.every((word, offset) => sentenceWords[start + offset].token === word);
      if (!matches) continue;
      let tokenStart = sentenceWords[start].index;
      let tokenEnd = sentenceWords[start + partWords.length - 1].index;
      if (tokenStart > 0 && /^["'“‘(]$/.test(sentenceTokens[tokenStart - 1])) tokenStart -= 1;
      if (tokenEnd < sentenceTokens.length - 1 && /^[,;:!?)]$/.test(sentenceTokens[tokenEnd + 1])) tokenEnd += 1;
      return { start: tokenStart, end: tokenEnd };
    }
    return null;
  }

  function getVerbTargetIndices(stage) {
    const tokens = tokenize(stage.sentence);
    const used = new Set();
    const targets = [];
    const verbs = Array.isArray(stage.verbs) && stage.verbs.length ? stage.verbs : [stage.verb];
    verbs.forEach((verb) => {
      const wanted = String(verb || "").toLowerCase();
      const index = tokens.findIndex((token, tokenIndex) => !used.has(tokenIndex) && token.toLowerCase() === wanted);
      if (index >= 0) {
        used.add(index);
        targets.push(index);
      }
    });
    return targets;
  }

  function getIdiomRanges(stage) {
    const tokens = tokenize(stage.sentence);
    const candidates = Array.isArray(stage.idioms) ? stage.idioms.slice() : [];
    const pattern = String(stage.grammarPattern || "").trim();
    if (pattern.split(/\s+/).length >= 2 && stage.sentence.toLowerCase().includes(pattern.toLowerCase()) && !candidates.some((item) => String(item.phrase).toLowerCase() === pattern.toLowerCase())) {
      const known = GRAMMAR_EXPRESSIONS.find((item) => item.phrase.toLowerCase() === pattern.toLowerCase());
      candidates.push({ phrase: pattern, meaning: known ? known.meaning.replace(/^.*?‘|’.*$/g, "") : String(stage.grammarExplanation || "").trim() });
    }
    const ranges = [];
    candidates.forEach((item) => {
      const phraseTokens = tokenize(item.phrase).filter((token) => /[A-Za-z]/.test(token)).map((token) => token.toLowerCase());
      if (phraseTokens.length < 2) return;
      const wordEntries = tokens.map((token, index) => ({ token: token.toLowerCase(), index })).filter((entry) => /[a-z]/.test(entry.token));
      for (let start = 0; start <= wordEntries.length - phraseTokens.length; start += 1) {
        if (!phraseTokens.every((token, offset) => wordEntries[start + offset].token === token)) continue;
        ranges.push({ start: wordEntries[start].index, end: wordEntries[start + phraseTokens.length - 1].index, phrase: String(item.phrase), meaning: String(item.meaning || "").trim() });
        break;
      }
    });
    return ranges;
  }

  function renderMeaningHalves() {
    const { meaningHalves, revealed, phase, halfIndex } = state.session;
    const halvesStarted = phase === "halves" || phase === "sentence" || phase === "complete";
    return meaningHalves.map((part, index) => {
      const active = halvesStarted && phase === "halves" && index === halfIndex;
      const shown = revealed[index];
      const weight = Math.max(1, (String(part.text || "").match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || []).length);
      return `<div class="sentence-meaning-part role-${part.kind}${active ? " is-active" : ""}${shown ? " is-revealed" : ""}" style="--part-weight:${weight}">
        <span>${shown ? escapeHtml(part.meaning) : "&nbsp;"}</span>
      </div>`;
    }).join("");
  }

  function renderQuiz(stage) {
    const phase = state.session.phase;
    if (phase === "halves") return "";
    if (phase === "complete") {
      const isLastSentence = state.currentIndex >= state.stages.length - 1;
      return `<div class="sentence-final">
        <div class="sentence-final__translation"><span>완성된 해석</span><strong>${escapeHtml(stage.sentenceMeaning)}</strong></div>
        <div class="sentence-structure-card">
          <span>문장 구조</span>
          <strong>${escapeHtml(stage.grammarPattern || state.session.grammar.pattern)}</strong>
          <p>${escapeHtml(stage.grammarExplanation || state.session.grammar.expression)}</p>
        </div>
        <button class="next-sentence-button" type="button" data-next-sentence="true"><span>${isLastSentence ? "학습 결과 보기" : "다음 문장"}</span><b>→</b></button>
      </div>`;
    }
    const config = getQuizConfig(stage);
    const options = config.options || [];
    const prompt = phase === "sentence" || phase === "halves"
      ? ""
      : `<div class="quiz-prompt"><span>${config.kicker}</span><strong>${config.promptHtml || escapeHtml(config.prompt)}</strong><small>${escapeHtml(config.hint)}</small></div>`;
    return `${prompt}
      ${options.length ? `<div class="quiz-options">${options.map((option, index) => `<button class="quiz-option" type="button" data-option-index="${index}"><b>${LABELS[index]}</b><span>${escapeHtml(option)}</span></button>`).join("")}</div>` : ""}`;
  }

  function getQuizConfig(stage) {
    const phase = state.session.phase;
    if (phase === "verb") {
      const count = Math.max(1, state.session.verbTargetIndices.length);
      return {
        kicker: "STEP 01 · FIND VERB",
        prompt: count > 1 ? `영어 문장에서 동사 ${count}개를 찾으세요.` : "영어 문장에서 동사를 클릭하세요.",
        promptHtml: count > 1 ? `영어 문장에서 동사 <em class="verb-count-emphasis">${count}개</em>를 찾으세요.` : "",
        hint: count > 1 ? "쉼표로 이어진 각 절의 동사를 모두 선택하세요." : "사람이나 사물의 동작·상태를 나타내는 말이에요.",
        options: []
      };
    }
    if (phase === "sentence") {
      const choices = getSentenceOptions(stage);
      return {
        kicker: `STEP ${String(state.session.meaningHalves.length + 1).padStart(2, "0")} · FULL SENTENCE`,
        prompt: "전체 문장 중 옳은 해석을 고르세요.",
        hint: "앞에서 맞힌 의미 덩어리를 자연스럽게 연결한 문장을 찾으세요.",
        options: choices.options,
        correct: choices.correct
      };
    }
    const index = state.session.halfIndex;
    const part = state.session.meaningHalves[index];
    const choices = getHalfOptions(index);
    return {
      kicker: `STEP ${String(index + 1).padStart(2, "0")} · ${part.label}`,
      prompt: `‘${part.text}’는 무슨 뜻일까요?`,
      hint: `${part.label}를 하나의 의미 덩어리로 읽고 알맞은 뜻을 고르세요.`,
      options: choices.options,
      correct: choices.correct
    };
  }

  function getHalfOptions(halfIndex) {
    const currentPart = state.session.meaningHalves[halfIndex];
    const correct = currentPart.meaning;
    if (Array.isArray(currentPart.options) && currentPart.options.length === 4 && currentPart.options.includes(correct)) {
      const wrong = currentPart.options.find((option) => option !== correct);
      const options = (state.currentIndex + halfIndex) % 2 === 0 ? [wrong, correct] : [correct, wrong];
      return { options, correct: options.indexOf(correct) };
    }
    const unique = [];
    const sameHalfMeanings = [];
    state.stages.forEach((stage, stageIndex) => {
      const grammar = analyzeGrammar(stage);
      const halves = getMeaningHalves(stage, grammar);
      if (stageIndex !== state.currentIndex && halves[halfIndex]) sameHalfMeanings.push(halves[halfIndex].meaning);
    });
    [...sameHalfMeanings, ...(HALF_MEANING_DISTRACTORS[currentPart.kind] || HALF_MEANING_DISTRACTORS.rest)].forEach((value) => {
      const cleaned = String(value || "").trim();
      if (cleaned && cleaned !== correct && !unique.includes(cleaned)) unique.push(cleaned);
    });
    const wrong = unique[0];
    const options = (state.currentIndex + halfIndex) % 2 === 0 ? [wrong, correct] : [correct, wrong];
    return { options, correct: options.indexOf(correct) };
  }

  function getSentenceOptions(stage) {
    const correct = stage.sentenceMeaning;
    const provided = Array.isArray(stage.sentenceOptions)
      ? stage.sentenceOptions.map((option) => String(option || "").trim()).filter(Boolean)
      : [];
    if (provided.length === 4 && provided.includes(correct)) {
      return { options: provided, correct: provided.indexOf(correct) };
    }
    const distractors = [];
    state.stages.forEach((item, index) => {
      const meaning = String(item.sentenceMeaning || "").trim();
      if (index !== state.currentIndex && meaning && meaning !== correct && !distractors.includes(meaning)) distractors.push(meaning);
    });
    ["한 소년은 조용한 마을에서 친구를 기다립니다.", "그것은 숲을 지나 새로운 길을 찾아갑니다.", "사람들은 해 질 무렵 따뜻한 기억을 떠올립니다.", "작은 새가 아침 일찍 높은 산 위로 날아갑니다."].forEach((meaning) => {
      if (meaning !== correct && !distractors.includes(meaning)) distractors.push(meaning);
    });
    const base = [correct, ...distractors.slice(0, 3)];
    const rotation = state.currentIndex % base.length;
    const options = base.map((_, index) => base[(index + rotation) % base.length]);
    return { options, correct: options.indexOf(correct) };
  }

  function handleBoardClick(event) {
    if (state.mode === "paragraph") {
      const wordButton = event.target.closest(".para-token.is-word");
      if (wordButton && wordButton.closest(".para-card.is-active")) showParagraphWordMeaning(wordButton);
      return;
    }
    if (!state.session) return;
    const replay = event.target.closest("[data-replay-sentence]");
    if (replay) {
      playEffect("tap");
      speakSentence(state.stages[state.currentIndex].sentence);
      return;
    }
    const nextSentence = event.target.closest("[data-next-sentence]");
    if (nextSentence && state.session.phase === "complete") {
      advanceToNextSentence();
      return;
    }
    const nextChunk = event.target.closest("[data-next-chunk]");
    if (nextChunk && state.session.phase === "halves") {
      advanceReadingChunk();
      return;
    }
    if (state.locked) return;
    const word = event.target.closest("[data-word-index]");
    if (word) {
      if (state.session.phase === "halves") showClickedWordMeaning(Number(word.dataset.wordIndex));
      else answerWord(word, Number(word.dataset.wordIndex));
      return;
    }
    const option = event.target.closest("[data-option-index]");
    if (option) answerOption(option, Number(option.dataset.optionIndex));
  }

  async function showClickedWordMeaning(tokenIndex) {
    const stage = state.stages[state.currentIndex];
    const token = tokenize(stage.sentence)[tokenIndex] || "";
    const lower = token.toLowerCase();
    const idiom = state.session.idiomRanges.find((range) => tokenIndex >= range.start && tokenIndex <= range.end);
    const lookupTerm = idiom ? idiom.phrase : token;
    const glossary = Array.isArray(stage.wordGlosses) ? stage.wordGlosses.find((item) => String(item.word || "").toLowerCase() === lower) : null;
    const localMeaning = window.HomeworkBuilder && typeof window.HomeworkBuilder.vocabularyMeaning === "function"
      ? window.HomeworkBuilder.vocabularyMeaning(lower)
      : "";
    state.session.selectedWordIndex = tokenIndex;
    state.session.selectedTerm = lookupTerm;
    state.session.selectedWordMeaning = String((idiom && idiom.meaning) || (glossary && glossary.meaning) || localMeaning || "Gemini에서 뜻을 찾는 중…");
    renderPages();
    if ((idiom && idiom.meaning) || (glossary && glossary.meaning) || localMeaning) return;
    const sentenceIndex = state.currentIndex;
    try {
      const apiKey = window.getGeminiKey();
      const result = await window.geminiAnalyze({ mode: "word", apiKey, word: lookupTerm, sentence: stage.sentence });
      if (!result.meaning) throw new Error("단어 뜻을 찾지 못했습니다.");
      const meaning = String(result.meaning).trim();
      if (!Array.isArray(stage.wordGlosses)) stage.wordGlosses = [];
      stage.wordGlosses.push({ word: token, meaning });
      saveWordGlossToBook(stage.sentence, token, meaning);
      if (state.currentIndex === sentenceIndex && state.session.selectedWordIndex === tokenIndex) {
        state.session.selectedWordMeaning = meaning;
        renderPages();
      }
    } catch (error) {
      if (state.currentIndex === sentenceIndex && state.session.selectedWordIndex === tokenIndex) {
        state.session.selectedWordMeaning = error.message || "Gemini에서 뜻을 찾지 못했습니다.";
        renderPages();
      }
    }
  }

  function saveWordGlossToBook(sentence, word, meaning) {
    try {
      const books = getStoredBooks();
      books.forEach((book) => {
        const item = book.sentences.find((entry) => String(entry.sentence || "").trim() === String(sentence || "").trim());
        if (!item) return;
        if (!Array.isArray(item.wordGlosses)) item.wordGlosses = [];
        const existing = item.wordGlosses.find((entry) => String(entry.word || "").toLowerCase() === String(word || "").toLowerCase());
        if (existing) existing.meaning = meaning;
        else item.wordGlosses.push({ word, meaning });
      });
      localStorage.setItem("lostSignalHomeworkBooks", JSON.stringify(books));
      if (books.length) localStorage.setItem("lostSignalHomeworkBook", JSON.stringify(books[0]));
    } catch (_) { /* local storage may be unavailable */ }
    scheduleCloudPush();
  }

  function advanceReadingChunk() {
    if (state.locked) return;
    const index = state.session.halfIndex;
    state.session.revealed[index] = true;
    playEffect("tap");
    if (index < state.session.meaningHalves.length - 1) {
      state.session.halfIndex += 1;
      renderPages();
      speakActiveChunk();
      return;
    }
    state.session.completed = true;
    state.session.revealed = state.session.revealed.map(() => true);
    updateStats();
    state.locked = true;
    state.advanceTimer = setTimeout(advanceToNextSentence, 220);
  }

  function answerWord(button, tokenIndex) {
    const stage = state.stages[state.currentIndex];
    const token = tokenize(stage.sentence)[tokenIndex] || "";
    const isCorrect = state.session.phase === "verb" && state.session.verbTargetIndices.includes(tokenIndex) && !state.session.foundVerbIndices.includes(tokenIndex);
    recordAttempt(isCorrect);
    if (!isCorrect) {
      playEffect("wrong");
      button.classList.add("is-wrong");
      setFeedback("문장의 동작이나 상태를 나타내는 말을 다시 찾아보세요.", false);
      return;
    }
    playEffect("correct");
    state.session.foundVerbIndices.push(tokenIndex);
    button.classList.add("is-verb");
    const remaining = state.session.verbTargetIndices.length - state.session.foundVerbIndices.length;
    if (remaining > 0) {
      state.locked = false;
      setFeedback(`‘${token}’을 찾았어요. 동사 ${remaining}개가 더 남았습니다.`, true);
      renderPages();
    } else {
      state.locked = true;
      setFeedback(state.session.verbTargetIndices.length > 1 ? "동사를 모두 찾았습니다." : `정확해요. ‘${token}’이 동사입니다.`, true);
      delayedPhase("halves");
    }
  }

  function answerOption(button, selectedIndex) {
    const stage = state.stages[state.currentIndex];
    const config = getQuizConfig(stage);
    const isCorrect = selectedIndex === config.correct;
    recordAttempt(isCorrect);
    if (!isCorrect) {
      playEffect("wrong");
      button.classList.add("is-wrong");
      button.disabled = true;
      setFeedback("아쉬워요. 고정된 문장과 표시된 성분을 보고 다시 골라보세요.", false);
      return;
    }
    playEffect("correct");
    state.locked = true;
    button.classList.add("is-correct");
    button.parentElement.querySelectorAll("button").forEach((item) => { item.disabled = true; });
    if (state.session.phase === "sentence") {
      state.session.completed = true;
      state.session.revealed = state.session.revealed.map(() => true);
      setFeedback("정답입니다. 바로 다음 문장으로 넘어갑니다.", true);
      updateStats();
      state.advanceTimer = setTimeout(advanceToNextSentence, 420);
      return;
    }
    const index = state.session.halfIndex;
    state.session.revealed[index] = true;
    const half = state.session.meaningHalves[index];
    setFeedback(`‘${half.text}’ → ‘${half.meaning}’`, true);
    state.advanceTimer = setTimeout(() => {
      if (index < state.session.meaningHalves.length - 1) {
        state.session.halfIndex += 1;
        state.locked = false;
        renderPages();
        updateLegend();
      } else {
        state.session.completed = true;
        state.session.revealed = state.session.revealed.map(() => true);
        setFeedback("끊어읽기를 모두 맞혔습니다. 바로 다음 문장으로 넘어갑니다.", true);
        updateStats();
        state.advanceTimer = setTimeout(advanceToNextSentence, 420);
      }
    }, 420);
  }

  function delayedPhase(nextPhase) {
    state.advanceTimer = setTimeout(() => {
      state.session.phase = nextPhase;
      if (nextPhase === "halves") state.session.halfIndex = 0;
      state.locked = false;
      renderPages();
      updateLegend();
    }, 360);
  }

  function advanceToNextSentence() {
    clearTimeout(state.advanceTimer);
    playEffect("tap");
    state.locked = true;
    const next = state.currentIndex + 1;
    if (next >= state.stages.length) finishStudy();
    else activateSentence(next);
  }

  function finishStudy() {
    clearInterval(state.timer);
    clearTimeout(state.advanceTimer);
    stopSpeech();
    updateTimer();
    const accuracy = getAccuracy();
    ui.study.hidden = true;
    ui.result.hidden = false;
    ui.resultSource.textContent = state.sourceTitle;
    ui.resultSr.textContent = state.srLevel;
    ui.resultTime.textContent = formatTime(state.elapsedSeconds);
    ui.resultAverage.textContent = `${Math.max(1, Math.round(state.elapsedSeconds / state.stages.length))}초`;
    ui.resultAccuracy.textContent = `${accuracy}%`;
  }

  function showLanding() {
    clearInterval(state.timer);
    clearTimeout(state.advanceTimer);
    stopSpeech();
    ui.study.hidden = true;
    ui.result.hidden = true;
    ui.homework.classList.remove("is-visible");
    ui.landing.classList.add("is-visible");
    renderSavedBooks();
  }

  function updateTimer() {
    if (!state.startedAt) return;
    state.elapsedSeconds = Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000));
    ui.elapsed.textContent = formatTime(state.elapsedSeconds);
  }

  function updateStats() {
    const completed = state.currentIndex + (state.session && state.session.completed ? 1 : 0);
    ui.progressCount.textContent = `${completed} / ${state.stages.length}`;
    ui.progressBar.style.width = `${(completed / state.stages.length) * 100}%`;
    ui.currentNumber.textContent = String(Math.min(state.currentIndex + 1, state.stages.length)).padStart(2, "0");
    ui.accuracy.textContent = `${getAccuracy()}%`;
  }

  function updateLegend() {
    const active = legendPhase();
    const order = ["halves", "sentence"];
    const activeIndex = order.indexOf(active);
    document.querySelectorAll("[data-legend-step]").forEach((item) => {
      const index = order.indexOf(item.dataset.legendStep);
      item.classList.toggle("is-current", index === activeIndex);
      item.classList.toggle("is-done", index < activeIndex);
    });
  }

  function legendPhase() {
    if (!state.session) return "verb";
    return state.session.phase;
  }

  function phaseSummary() {
    if (!state.session) return "문장을 준비하고 있어요.";
    const phase = state.session.phase;
    if (phase === "verb") return "동사를 찾아 문장의 중심을 잡으세요.";
    if (phase === "halves") return `${state.session.meaningHalves[state.session.halfIndex].label}를 의미 덩어리로 연결하세요.`;
    if (phase === "sentence") return "의미 덩어리를 연결한 전체 해석을 고르세요.";
    return "완성된 해석과 문장 구조를 확인하세요.";
  }

  function activeInstructionTitle() {
    if (!state.session) return "문장을 읽어보세요";
    const phase = state.session.phase;
    if (phase === "verb") return "동사를 찾으세요";
    if (phase === "halves") return "괄호 안의 뜻을 맞추세요";
    if (phase === "sentence") return "전체 문장의 옳은 해석을 고르세요";
    return "문장이 완성됐어요";
  }

  function activeStateLabel() {
    const phase = state.session && state.session.phase;
    if (phase === "halves") return `뜻 맞히기 ${state.session.halfIndex + 1}/${state.session.meaningHalves.length}`;
    if (phase === "sentence") return "전체 해석";
    if (phase === "complete") return "구조 확인";
    if (phase === "verb" && state.session.verbTargetIndices.length > 1) return `동사 ${state.session.foundVerbIndices.length}/${state.session.verbTargetIndices.length}`;
    return "동사 찾기";
  }

  function recordAttempt(correct) {
    state.attempts += 1;
    if (!correct) state.mistakes += 1;
    updateStats();
  }

  function getAccuracy() {
    if (!state.attempts) return 100;
    return Math.max(0, Math.round(((state.attempts - state.mistakes) / state.attempts) * 100));
  }

  function setFeedback(message, good) {
    ui.feedback.textContent = message;
    ui.feedback.classList.toggle("is-wrong", !good);
  }

  function showToast(message) {
    ui.toast.textContent = message;
    ui.toast.classList.add("is-visible");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => ui.toast.classList.remove("is-visible"), 1600);
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  }

  function formatSr(value) {
    const cleaned = String(value || "").replace(/^SR\s*/i, "").trim();
    const numeric = Number(cleaned);
    return Number.isFinite(numeric) && cleaned !== "" ? numeric.toFixed(1) : (cleaned || "직접 입력");
  }

  function tokenize(sentence) {
    return String(sentence || "").match(/[A-Za-z]+(?:'[A-Za-z]+)?|[^\sA-Za-z]/g) || [];
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function playEffect(type) {
    if (!state.sound) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!effectAudioContext) effectAudioContext = new AudioContextClass();
    if (effectAudioContext.state === "suspended") effectAudioContext.resume();
    const now = effectAudioContext.currentTime;
    const notes = type === "correct"
      ? [{ frequency: 620, offset: 0, duration: .12, volume: .15 }, { frequency: 860, offset: .08, duration: .16, volume: .14 }]
      : type === "wrong"
        ? [{ frequency: 230, offset: 0, duration: .16, volume: .14 }, { frequency: 165, offset: .09, duration: .2, volume: .12 }]
        : [{ frequency: 540, offset: 0, duration: .1, volume: .13 }];
    notes.forEach((note) => {
      const oscillator = effectAudioContext.createOscillator();
      const gain = effectAudioContext.createGain();
      const start = now + note.offset;
      oscillator.type = type === "wrong" ? "sawtooth" : "sine";
      oscillator.frequency.setValueAtTime(note.frequency, start);
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(note.volume, start + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, start + note.duration);
      oscillator.connect(gain);
      gain.connect(effectAudioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + note.duration + .02);
    });
  }

  function stopSpeech() {
    speechRequest += 1;
    clearTimeout(speechRetryTimer);
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }

  function speakSentence(sentence) {
    if (!state.sound || !("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") return;
    const request = ++speechRequest;
    clearTimeout(speechRetryTimer);
    speechSynthesis.cancel();
    const trySpeak = (attempt) => {
      if (request !== speechRequest || !state.sound) return;
      const voices = speechSynthesis.getVoices().filter((voice) => /^en(?:-|_)/i.test(voice.lang) && !NOVELTY_VOICES.test(voice.name));
      if (!voices.length && attempt < 8) {
        speechRetryTimer = setTimeout(() => trySpeak(attempt + 1), 180);
        return;
      }
      const preferred = VOICE_PRIORITY.map((pattern) => voices.find((voice) => pattern.test(voice.name))).find(Boolean);
      const naturalLocal = voices.find((voice) => voice.localService && /^en-US$/i.test(voice.lang)) || voices.find((voice) => voice.localService);
      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.voice = preferred || naturalLocal || voices[0] || null;
      utterance.lang = utterance.voice ? utterance.voice.lang : "en-US";
      utterance.rate = .78;
      utterance.pitch = .98;
      utterance.volume = 1;
      speechSynthesis.speak(utterance);
    };
    speechRetryTimer = setTimeout(() => trySpeak(0), 220);
  }

  function analyzeGrammar(stage) {
    const tokens = stage.sentence.match(/[A-Za-z']+/g) || [];
    const lower = tokens.map((token) => token.toLowerCase());
    const verb = String(stage.verb || "").toLowerCase();
    let verbIndex = lower.indexOf(verb);
    if (verbIndex < 0) verbIndex = Math.min(1, Math.max(0, tokens.length - 1));
    const subject = tokens.slice(0, verbIndex).join(" ") || tokens[0] || "주어";
    const verbText = tokens[verbIndex] || stage.verb || "동사";
    const selectedPreposition = String(stage.preposition || "").toLowerCase();
    let modifierIndex = selectedPreposition ? lower.indexOf(selectedPreposition, verbIndex + 1) : -1;
    if (modifierIndex < 0) modifierIndex = lower.findIndex((token, index) => index > verbIndex && COMMON_PREPOSITIONS.has(token));
    const modifierText = modifierIndex >= 0 ? tokens.slice(modifierIndex).join(" ") : "";
    let pattern = "S + V";
    let parts = [{ code: "S", role: "주어", text: subject }, { code: "V", role: "동사", text: verbText }];
    let expression = "주어와 동사를 먼저 찾으면 문장의 중심 뜻이 보여요.";

    if (/\?\s*$/.test(stage.sentence) && QUESTION_AUXILIARIES.has(lower[0])) {
      pattern = "조동사·be동사 + S + V ... ?";
      parts = [{ code: "Q", role: "의문문 시작", text: tokens[0] }, { code: "CORE", role: "질문의 중심 내용", text: tokens.slice(1).join(" ") }];
      expression = "질문에서는 조동사나 be동사가 주어 앞으로 이동해요.";
    } else if (lower[0] === "there" && BE_VERBS.has(lower[1])) {
      pattern = "There + be동사 + S";
      parts = [{ code: "THERE", role: "존재를 여는 말", text: tokens[0] }, { code: "V", role: "be동사", text: tokens[1] }, { code: "S", role: "실제 주어", text: tokens.slice(2, modifierIndex >= 0 ? modifierIndex : tokens.length).join(" ") }];
      if (modifierText) parts.push({ code: "M", role: "장소·시간 설명", text: modifierText });
      expression = "There is/are는 실제 주어가 be동사 뒤에 오는 존재 문장이에요.";
    } else {
      const thatIndex = lower.indexOf("that", verbIndex + 1);
      const toIndex = lower.indexOf("to", verbIndex + 1);
      const clauseMarkers = { because: "이유", when: "시간", if: "조건", although: "양보", while: "시간·대조" };
      const clauseIndex = lower.findIndex((token, index) => index > verbIndex && clauseMarkers[token]);
      if (thatIndex >= 0) {
        pattern = "S + V + that절(O)";
        parts.push({ code: "O", role: "목적어 역할의 that절", text: tokens.slice(thatIndex).join(" ") });
        expression = "that 뒤의 완전한 문장 전체가 목적어 역할을 해요.";
      } else if (toIndex > verbIndex && TO_INFINITIVE_HEADS.has(verb)) {
        const objectBeforeTo = tokens.slice(verbIndex + 1, toIndex).join(" ");
        if (objectBeforeTo) parts.push({ code: "O", role: "목적어", text: objectBeforeTo });
        parts.push({ code: "TO", role: "to부정사", text: tokens.slice(toIndex, modifierIndex > toIndex ? modifierIndex : tokens.length).join(" ") });
        if (modifierIndex > toIndex) parts.push({ code: "M", role: "추가 설명", text: modifierText });
        pattern = objectBeforeTo ? "S + V + O + to부정사" : "S + V + to부정사";
        expression = "to 뒤의 동사원형은 ‘~하는 것’ 또는 ‘~하기 위해’라는 뜻 덩어리를 만들어요.";
      } else if (clauseIndex >= 0) {
        const objectText = tokens.slice(verbIndex + 1, clauseIndex).join(" ");
        if (objectText) parts.push({ code: "O", role: "동사 뒤 내용", text: objectText });
        parts.push({ code: "SUB", role: `${clauseMarkers[lower[clauseIndex]]}을 나타내는 절`, text: tokens.slice(clauseIndex).join(" ") });
        pattern = `주절 + ${lower[clauseIndex]}절`;
        expression = `${tokens[clauseIndex]} 뒤의 문장이 ${clauseMarkers[lower[clauseIndex]]}을 설명해요.`;
      } else if (BE_VERBS.has(verb)) {
        const complement = tokens.slice(verbIndex + 1, modifierIndex >= 0 ? modifierIndex : tokens.length).join(" ");
        pattern = modifierText ? "S + V + C + M" : "S + V + C";
        if (complement) parts.push({ code: "C", role: "주어를 설명하는 보어", text: complement });
        if (modifierText) parts.push({ code: "M", role: "장소·시간 설명", text: modifierText });
        expression = "be동사 뒤의 보어가 주어의 상태나 정체를 설명해요.";
      } else {
        const objectEnd = modifierIndex >= 0 ? modifierIndex : tokens.length;
        const particleIndex = lower.findIndex((token, index) => index > verbIndex && index < objectEnd && ["back", "up", "out", "away"].includes(token));
        const objectTokens = tokens.slice(verbIndex + 1, particleIndex >= 0 ? particleIndex : objectEnd);
        if (objectTokens.length) parts.push({ code: "O", role: "목적어", text: objectTokens.join(" ") });
        if (particleIndex >= 0) parts.push({ code: "P", role: "동사의 뜻을 완성하는 말", text: tokens[particleIndex] });
        if (modifierText) parts.push({ code: "M", role: "장소·시간·방법 설명", text: modifierText });
        pattern = `S + V${objectTokens.length ? " + O" : ""}${particleIndex >= 0 ? " + P" : ""}${modifierText ? " + M" : ""}`;
      }
    }
    const lowerSentence = ` ${stage.sentence.toLowerCase().replace(/[^a-z']+/g, " ").trim()} `;
    const foundExpression = GRAMMAR_EXPRESSIONS.find((item) => lowerSentence.includes(` ${item.phrase} `));
    if (foundExpression) expression = foundExpression.meaning;
    else if (modifierText) expression = `‘${modifierText}’는 장소·시간·방법을 덧붙이는 표현이에요.`;
    return { pattern, parts, expression };
  }

  function getMeaningHalves(stage, grammar) {
    const generatedChunks = Array.isArray(stage.chunks) ? stage.chunks.map((chunk, index) => {
      const meaning = String(chunk.meaning || "").trim();
      const options = Array.isArray(chunk.options) ? chunk.options.map((value) => String(value || "").trim()).filter(Boolean).slice(0, 4) : [];
      return {
        kind: "generated",
        label: String(chunk.role || `의미 덩어리 ${index + 1}`).trim(),
        text: String(chunk.text || "").trim(),
        meaning,
        options: options.length === 4 && options.includes(meaning) ? options : []
      };
    }).filter((chunk) => chunk.text && chunk.meaning) : [];
    if (generatedChunks.length >= 2) return generatedChunks;

    const tokens = String(stage.sentence || "").match(/[A-Za-z']+/g) || [];
    const lower = tokens.map((token) => token.toLowerCase());
    let verbIndex = lower.indexOf(String(stage.verb || "").toLowerCase());
    if (verbIndex < 0) verbIndex = Math.min(1, Math.max(0, tokens.length - 1));
    const splitIndex = Math.min(tokens.length, Math.max(1, verbIndex + 1));
    const coreText = tokens.slice(0, splitIndex).join(" ");
    const restText = tokens.slice(splitIndex).join(" ");
    const supplied = Array.isArray(stage.grammarGlosses)
      ? stage.grammarGlosses.map((value) => String(value || "").trim())
      : [];
    const subjectIndex = grammar.parts.findIndex((part) => ["S", "THERE"].includes(part.code));
    const grammarVerbIndex = grammar.parts.findIndex((part) => part.code === "V");
    let coreMeaning = "";
    let restMeaning = "";
    const translated = splitKoreanMeaning(stage.sentenceMeaning);

    if (translated.structured) {
      coreMeaning = translated.core;
      restMeaning = translated.rest;
    } else if (subjectIndex >= 0 && grammarVerbIndex >= 0 && supplied.length >= grammar.parts.length) {
      coreMeaning = [supplied[subjectIndex], supplied[grammarVerbIndex]].filter(Boolean).join(" ");
      restMeaning = supplied.filter((value, index) => index !== subjectIndex && index !== grammarVerbIndex && value).join(" · ");
    }

    if (!coreMeaning || (restText && !restMeaning)) {
      coreMeaning = coreMeaning || translated.core;
      restMeaning = restMeaning || translated.rest;
    }

    const halves = [{
      kind: "core",
      label: "주어 + 동사",
      text: coreText || String(stage.sentence || "").trim(),
      meaning: coreMeaning || stage.verbMeaning || stage.sentenceMeaning
    }];
    if (restText) {
      halves.push({
        kind: "rest",
        label: "나머지 부분",
        text: restText,
        meaning: restMeaning || stage.sentenceMeaning
      });
    }
    return halves;
  }

  function splitKoreanMeaning(translation) {
    const text = String(translation || "").replace(/[.!?]+$/, "").trim();
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length < 2) return { core: text, rest: text, structured: false };
    const subjectEnd = words.findIndex((word) => /(?:은|는|이|가)$/.test(word));
    if (subjectEnd >= 0 && subjectEnd < words.length - 1) {
      const previous = words[words.length - 2] || "";
      const predicateStart = words.length > subjectEnd + 2 && !/(?:은|는|이|가|을|를|에|에서|로|으로|와|과|의|도|만|부터|까지)$/.test(previous)
        ? words.length - 2
        : words.length - 1;
      return {
        core: [...words.slice(0, subjectEnd + 1), ...words.slice(predicateStart)].join(" "),
        rest: words.slice(subjectEnd + 1, predicateStart).join(" "),
        structured: true
      };
    }
    const middle = Math.max(1, Math.ceil(words.length / 2));
    return { core: words.slice(0, middle).join(" "), rest: words.slice(middle).join(" "), structured: false };
  }

  function getGrammarGlosses(stage, parts) {
    const supplied = Array.isArray(stage.grammarGlosses) ? stage.grammarGlosses.map((value) => String(value || "").trim()) : [];
    const derived = deriveKoreanParts(stage.sentenceMeaning);
    return parts.map((part, index) => {
      if (supplied[index]) return supplied[index];
      if (part.code === "V") return stage.verbMeaning || "동작·상태";
      if (part.code === "M" && derived.modifier) return derived.modifier;
      if (part.code === "M" && stage.prepositionMeaning) return stage.prepositionMeaning.replace(/^~/, "");
      if (part.code === "S" && derived.subject) return derived.subject;
      if (part.code === "O" && derived.object) return derived.object;
      if (part.code === "C" && derived.complement) return derived.complement;
      if (part.code === "P") return "동사의 뜻을 완성하는 말";
      if (part.code === "TO") return "~하는 것 · ~하기 위해";
      if (part.code === "SUB") return "이유·시간·조건을 덧붙이는 절";
      return part.role;
    });
  }

  function deriveKoreanParts(translation) {
    const text = String(translation || "").replace(/[.!?]+$/, "").trim();
    const words = text.split(/\s+/).filter(Boolean);
    const subjectEnd = words.findIndex((word) => /(?:은|는|이|가)$/.test(word));
    const objectEnd = words.findIndex((word, index) => index > subjectEnd && /(?:을|를)$/.test(word));
    const subject = subjectEnd >= 0 ? words.slice(0, subjectEnd + 1).join(" ") : "";
    const objectStart = subjectEnd + 1;
    const object = objectEnd >= 0 ? words.slice(objectStart, objectEnd + 1).join(" ") : "";
    const verb = words[words.length - 1] || "";
    const middleEnd = objectEnd >= 0 ? objectStart : words.length - 1;
    const modifier = subjectEnd >= 0 && middleEnd > subjectEnd + 1 ? words.slice(subjectEnd + 1, middleEnd).join(" ") : "";
    const complement = subjectEnd >= 0 ? words.slice(subjectEnd + 1, Math.max(subjectEnd + 1, words.length - 1)).join(" ") : "";
    return { subject, object, modifier, complement, verb };
  }
})();
