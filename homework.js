(function () {
  "use strict";

  const MAX_BOOK_SENTENCES = 200;
  const translationCache = new Map();
  const AUTO_WORD_MEANINGS = {
    i: "나는", you: "너는", he: "그는", she: "그녀는", it: "그것은", we: "우리는", they: "그들은",
    my: "나의", your: "너의", his: "그의", her: "그녀의", our: "우리의", their: "그들의",
    a: "한", an: "한", the: "그", this: "이", that: "그", these: "이것들", those: "그것들",
    how: "어떻게", what: "무엇", when: "언제", where: "어디", who: "누구", why: "왜",
    spider: "거미", spiders: "거미", dog: "개", dogs: "개", cat: "고양이", cats: "고양이",
    book: "책", books: "책", friend: "친구", friends: "친구들", school: "학교", home: "집",
    boy: "소년", girl: "소녀", people: "사람들", animal: "동물", animals: "동물들"
  };

  const PREPOSITIONS = {
    at: "~에 (시각·장소)", in: "~안에, ~에서", on: "~위에, ~에", from: "~로부터, ~에서",
    to: "~에게, ~로", with: "~와 함께, ~을 사용하여", for: "~을 위한, ~동안", of: "~의",
    by: "~에 의해, ~옆에", about: "~에 관하여", under: "~아래에", over: "~위에, ~을 넘어",
    through: "~을 통해, ~을 지나", beside: "~의 옆에", between: "~사이에", among: "~사이에",
    before: "~전에, ~앞에", after: "~후에", into: "~안으로", out: "~밖으로",
    near: "~근처에", behind: "~뒤에", across: "~을 가로질러", around: "~주위에",
    during: "~동안", without: "~없이", toward: "~을 향하여", against: "~에 맞서"
  };

  const VERBS = {
    am: "~이다", is: "~이다", are: "~이다", was: "~이었다", were: "~이었다", be: "~이다", been: "~이었다", being: "~인 상태이다",
    have: "가지고 있다", has: "가지고 있다", had: "가지고 있었다", do: "하다", does: "한다", did: "했다",
    go: "가다", goes: "간다", went: "갔다", come: "오다", comes: "온다", came: "왔다",
    see: "보다", sees: "본다", saw: "보았다", look: "보다", looks: "본다", looked: "보았다",
    make: "만들다", makes: "만든다", made: "만들었다", take: "가져가다", takes: "가져간다", took: "가져갔다",
    get: "얻다", gets: "얻는다", got: "얻었다", give: "주다", gives: "준다", gave: "주었다",
    find: "찾다", finds: "찾는다", found: "찾았다", know: "알다", knows: "안다", knew: "알았다",
    think: "생각하다", thinks: "생각한다", thought: "생각했다", say: "말하다", says: "말한다", said: "말했다",
    tell: "말해주다", tells: "말해준다", told: "말해주었다", ask: "묻다", asks: "묻는다", asked: "물었다",
    answer: "대답하다", answers: "대답한다", play: "놀다, 경기하다", plays: "논다, 경기한다", played: "놀았다, 경기했다",
    study: "공부하다", studies: "공부한다", studied: "공부했다", learn: "배우다", learns: "배운다", learned: "배웠다",
    read: "읽다", reads: "읽는다", write: "쓰다", writes: "쓴다", wrote: "썼다",
    eat: "먹다", eats: "먹는다", ate: "먹었다", drink: "마시다", drinks: "마신다", drank: "마셨다",
    run: "달리다", runs: "달린다", ran: "달렸다", walk: "걷다", walks: "걷는다", walked: "걸었다",
    live: "살다", lives: "산다", lived: "살았다", like: "좋아하다", likes: "좋아한다", liked: "좋아했다",
    love: "사랑하다", loves: "사랑한다", want: "원하다", wants: "원한다", need: "필요로 하다", needs: "필요로 한다",
    help: "돕다", helps: "돕는다", helped: "도왔다", use: "사용하다", uses: "사용한다", used: "사용했다",
    call: "부르다", calls: "부른다", leave: "떠나다", leaves: "떠난다", left: "떠났다",
    steal: "빼앗다", steals: "빼앗는다", stole: "빼앗았다", remember: "기억하다", remembers: "기억한다", remembered: "기억했다",
    guide: "안내하다", guides: "안내한다", guided: "안내했다", set: "정하다", sets: "정한다",
    bring: "가져오다", brings: "가져온다", brought: "가져왔다", move: "움직이다", moves: "움직인다", moved: "움직였다",
    open: "열다", opens: "연다", opened: "열었다", close: "닫다", closes: "닫는다", closed: "닫았다",
    start: "시작하다", starts: "시작한다", started: "시작했다", stop: "멈추다", stops: "멈춘다", stopped: "멈췄다",
    meet: "만나다", meets: "만난다", met: "만났다", visit: "방문하다", visits: "방문한다", visited: "방문했다",
    enjoy: "즐기다", enjoys: "즐긴다", enjoyed: "즐겼다", become: "~이 되다", becomes: "~이 된다", became: "~이 되었다",
    feel: "느끼다", feels: "느낀다", felt: "느꼈다", keep: "유지하다", keeps: "유지한다", kept: "유지했다",
    show: "보여주다", shows: "보여준다", showed: "보여주었다", watch: "지켜보다", watches: "지켜본다", watched: "지켜보았다",
    work: "일하다", works: "일한다", worked: "일했다", grow: "자라다", grows: "자란다", grew: "자랐다",
    wait: "기다리다", waits: "기다린다", waited: "기다렸다", listen: "듣다", listens: "듣는다", listened: "들었다",
    speak: "말하다", speaks: "말한다", spoke: "말했다", buy: "사다", buys: "산다", bought: "샀다",
    sleep: "자다", sleeps: "잔다", slept: "잤다", teach: "가르치다", teaches: "가르친다", taught: "가르쳤다",
    travel: "여행하다", travels: "여행한다", traveled: "여행했다", arrive: "도착하다", arrives: "도착한다", arrived: "도착했다",
    put: "놓다", puts: "놓는다", try: "시도하다", tries: "시도한다", tried: "시도했다",
    begin: "시작하다", begins: "시작한다", began: "시작했다", choose: "고르다", chooses: "고른다", chose: "골랐다",
    draw: "그리다", draws: "그린다", drew: "그렸다", hear: "듣다", hears: "듣는다", heard: "들었다",
    sit: "앉다", sits: "앉는다", sat: "앉았다", stand: "서다", stands: "선다", stood: "섰다"
  };

  const AUXILIARIES = new Set(["am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did"]);
  const VERB_DISTRACTORS = ["가다", "보다", "만들다", "기다리다", "도와주다", "기억하다", "사용하다", "움직이다", "생각하다", "찾다"];
  const PREPOSITION_DISTRACTORS = ["~위에", "~로부터", "~와 함께", "~을 위해", "~의 옆에", "~을 통해", "~전에", "~뒤에"];
  const KEY_WORD_DISTRACTORS = ["마을", "숲", "평화", "빛", "친구", "기억", "시간", "길"];
  const SENTENCE_DISTRACTORS = [
    "소년은 조용한 마을에서 잠든다.", "친구들은 그를 멀리서 기다린다.", "사람들은 새로운 길을 함께 찾는다.",
    "빛나는 화면이 어두운 길을 비춘다.", "아이는 아침마다 책을 읽는다.", "모두가 따뜻한 집으로 돌아온다."
  ];

  const WORD_MEANINGS = {
    adventure: "모험", attention: "관심, 주의", peace: "평화", village: "마을", sunset: "해 질 무렵",
    forest: "숲", endless: "끝없는", light: "빛", warm: "따뜻한", face: "얼굴", canyon: "협곡",
    healthy: "건강한", limit: "제한", screen: "화면", moment: "순간", quiet: "조용한", lonely: "외로운",
    environment: "환경", nature: "자연", energy: "에너지", important: "중요한", different: "다른",
    culture: "문화", history: "역사", science: "과학", experiment: "실험", discover: "발견하다",
    information: "정보", communicate: "의사소통하다", communication: "의사소통", technology: "기술", problem: "문제", solution: "해결책",
    protect: "보호하다", pollution: "오염", recycle: "재활용하다", future: "미래", traditional: "전통적인",
    popular: "인기 있는", special: "특별한", famous: "유명한", possible: "가능한", difficult: "어려운",
    interesting: "흥미로운", beautiful: "아름다운", dangerous: "위험한", careful: "조심하는", useful: "유용한",
    together: "함께", usually: "보통", sometimes: "때때로", suddenly: "갑자기", finally: "마침내",
    during: "~동안", journey: "여행, 여정", country: "나라", language: "언어", classroom: "교실",
    homework: "숙제", subject: "과목, 주제", example: "예시", reason: "이유", result: "결과",
    animal: "동물", plant: "식물", ocean: "바다", mountain: "산", weather: "날씨", season: "계절", natural: "자연의",
    family: "가족", neighbor: "이웃", community: "지역 사회", experience: "경험", activity: "활동",
    fun: "재미있는 것, 재미", kind: "친절한", safe: "안전한", true: "사실인", idea: "생각, 아이디어",
    understand: "이해하다", decide: "결정하다", explain: "설명하다", continue: "계속하다", prepare: "준비하다",
    improve: "향상시키다", create: "만들다", change: "바꾸다", believe: "믿다", happen: "일어나다",
    preparation: "준비", environmental: "환경의", scientific: "과학적인", encourage: "격려하다", encourages: "격려한다"
  };

  const STOPWORDS = new Set([
    "a", "an", "the", "this", "that", "these", "those", "i", "you", "he", "she", "it", "we", "they",
    "me", "him", "her", "us", "them", "my", "your", "his", "its", "our", "their", "and", "but", "or",
    "so", "because", "if", "when", "while", "who", "what", "where", "why", "how", "not", "no", "yes",
    "very", "more", "most", "some", "any", "all", "each", "every", "one", "two", "first", "also", "just"
  ]);

  const BASIC_WORDS = new Set([
    "boy", "girl", "man", "woman", "child", "children", "friend", "school", "home", "house", "day", "night",
    "morning", "today", "tomorrow", "time", "year", "people", "person", "thing", "way", "good", "bad", "new",
    "old", "big", "small", "long", "short", "happy", "sad", "book", "food", "water", "name", "game", "world",
    "go", "come", "see", "look", "make", "take", "get", "give", "say", "tell", "play", "read", "write", "eat",
    "run", "walk", "live", "like", "love", "want", "help", "use", "start", "stop"
  ]);

  const WORLD_STYLES = [
    { world: "village", palette: { sky: 0xf39b77, fog: 0xd98b78, ground: 0x253f43, path: 0x73584d, accent: 0xffcb7d }, location: "사진 속 첫 번째 길" },
    { world: "forest", palette: { sky: 0x173b4b, fog: 0x193d43, ground: 0x142d2d, path: 0x47594a, accent: 0x76e6bc }, location: "본문의 숲" },
    { world: "notifications", palette: { sky: 0x351a4d, fog: 0x321c4a, ground: 0x1a1630, path: 0x403357, accent: 0xff4f93 }, location: "단어의 협곡" },
    { world: "memory", palette: { sky: 0x193b66, fog: 0x29456b, ground: 0x192d44, path: 0x4b5668, accent: 0xffd783 }, location: "문장의 광장" },
    { world: "canyon", palette: { sky: 0x10182e, fog: 0x18233c, ground: 0x101827, path: 0x273248, accent: 0x61d9ff }, location: "해석의 길" },
    { world: "shore", palette: { sky: 0x5e78a4, fog: 0x7188a9, ground: 0x243f4d, path: 0x667077, accent: 0xa9efff }, location: "숙제의 해변" },
    { world: "home", palette: { sky: 0x9ed8e6, fog: 0xb9e3df, ground: 0x3d6656, path: 0x9b8569, accent: 0xffe69b }, location: "완성의 마을" }
  ];

  const state = {
    files: [], pageFiles: [], previewUrls: [], sentences: [], pendingStages: [],
    onStart: null, bound: false, worker: null, recognizing: false, coverRecognizing: false, translatorPromise: null, translatorStatus: "unknown", pasteTarget: "cover",
    sourceMeta: { sourceTitle: "My Reading Text", srLevel: "직접 입력" }
  };
  let ui = {};

  function $(selector) { return document.querySelector(selector); }

  function init(options) {
    state.onStart = options && options.onStart;
    if (state.bound) return;
    ui = {
      title: $("#title-screen"), screen: $("#homework-screen"), back: $("#homework-back"), open: $("#homework-button"),
      geminiKey: $("#gemini-api-key-input"), bookTitle: $("#book-title-input"), bookSr: $("#book-sr-input"), bookSource: $("#book-source-select"),
      coverZone: $("#cover-paste-zone"), coverStatus: $("#cover-status"), bodyZone: $("#body-paste-zone"),
      step: $("#homework-step-label"), uploadView: $("#homework-upload-view"), reviewView: $("#homework-review-view"),
      previews: $("#photo-preview-list"), recognize: $("#recognize-button"), manual: $("#manual-entry-button"),
      progress: $("#ocr-progress"), progressBar: $("#ocr-progress-bar"), status: $("#ocr-status"), percent: $("#ocr-percent"),
      message: $("#homework-message"), reviewMessage: $("#review-message"), editors: $("#sentence-editor-list"), total: $("#sentence-total"),
      add: $("#add-sentence-button"), build: $("#build-homework-game"), reviewBack: $("#review-back-button"),
    };
    try { ui.geminiKey.value = window.getGeminiKey(); } catch (_) { /* storage may be unavailable */ }
    checkTranslatorAvailability();
    ui.open.addEventListener("click", open);
    ui.back.addEventListener("click", close);
    ui.coverZone.addEventListener("click", () => selectPasteTarget("cover"));
    ui.bodyZone.addEventListener("click", () => selectPasteTarget("body"));
    ui.geminiKey.addEventListener("input", () => {
      window.saveGeminiKey(ui.geminiKey.value);
    });
    document.addEventListener("paste", handleClipboardPaste);
    ui.recognize.addEventListener("click", recognizePhotos);
    ui.manual.addEventListener("click", addSentence);
    ui.add.addEventListener("click", addSentence);
    ui.reviewBack.addEventListener("click", continueAddingPhotos);
    ui.build.addEventListener("click", buildGame);
    state.bound = true;
  }

  function open() {
    ui.title.classList.remove("is-visible");
    ui.screen.classList.add("is-visible");
    state.pasteTarget = ui.bookTitle.value.trim() ? "body" : "cover";
    showUpload();
    if (state.sentences.length) showReview(state.sentences, { scroll: false });
  }

  function close() {
    ui.screen.classList.remove("is-visible");
    ui.title.classList.add("is-visible");
  }

  function showUpload() {
    ui.uploadView.hidden = false;
    ui.reviewView.hidden = state.sentences.length === 0;
    ui.step.textContent = "책 만들기 · 사진 계속 추가";
    setMessage(ui.message, "");
    selectPasteTarget(state.pasteTarget || "cover");
  }

  function showReview(items, options = {}) {
    state.sentences = options.append
      ? mergeSentenceItems(state.sentences, items)
      : items.slice(0, MAX_BOOK_SENTENCES);
    ui.uploadView.hidden = false;
    ui.reviewView.hidden = false;
    ui.step.textContent = "책 만들기 · 문장 확인";
    setMessage(ui.reviewMessage, "");
    renderEditors();
    if (options.scroll !== false) ui.reviewView.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function queueBodyFiles(files) {
    const images = files.filter((file) => file && file.type && file.type.startsWith("image/")).slice(0, 12);
    images.forEach((file) => {
      state.files.push(file);
      state.pageFiles.push(file);
      const url = URL.createObjectURL(file);
      state.previewUrls.push(url);
      const preview = document.createElement("div");
      preview.className = "photo-preview";
      const image = document.createElement("img");
      image.src = url;
      image.alt = "선택한 숙제 사진";
      const name = document.createElement("span");
      name.textContent = file.name;
      preview.append(image, name);
      ui.previews.appendChild(preview);
    });
    ui.recognize.disabled = state.files.length === 0;
    if (images.length) setMessage(ui.message, `본문 사진 ${state.pageFiles.length}장을 순서대로 보관했어요. 사진을 모두 넣은 뒤 ‘문장 찾기’를 눌러주세요.`, true);
  }

  function handleClipboardPaste(event) {
    if (!ui.screen.classList.contains("is-visible")) return;
    const images = Array.from((event.clipboardData && event.clipboardData.items) || [])
      .filter((item) => item.type && item.type.startsWith("image/"))
      .map((item) => item.getAsFile())
      .filter(Boolean);
    if (!images.length) return;
    event.preventDefault();
    if (state.pasteTarget === "cover") recognizeCoverImage(images[0]);
    else queueBodyFiles(images);
  }

  function selectPasteTarget(target) {
    state.pasteTarget = target === "body" ? "body" : "cover";
    const coverSelected = state.pasteTarget === "cover";
    ui.coverZone.classList.toggle("is-selected", coverSelected);
    ui.bodyZone.classList.toggle("is-selected", !coverSelected);
    ui.coverZone.setAttribute("aria-pressed", String(coverSelected));
    ui.bodyZone.setAttribute("aria-pressed", String(!coverSelected));
    if (document.activeElement !== (coverSelected ? ui.coverZone : ui.bodyZone)) {
      (coverSelected ? ui.coverZone : ui.bodyZone).focus({ preventScroll: true });
    }
  }

  async function recognizeCoverImage(file) {
    if (state.coverRecognizing) return;
    state.coverRecognizing = true;
    ui.coverStatus.textContent = "Gemini가 표지에서 책 제목을 찾는 중…";
    ui.coverStatus.classList.remove("is-good");
    try {
      const result = await analyzeImageWithGemini("cover", file);
      const title = String(result.title || "").trim();
      if (!title) throw new Error("표지에서 제목을 찾지 못했어요. 제목 칸에 직접 적어주세요.");
      ui.bookTitle.value = title;
      ui.coverStatus.textContent = `Gemini가 책 제목을 찾았어요: ${title}`;
      ui.coverStatus.classList.add("is-good");
      selectPasteTarget("body");
    } catch (error) {
      ui.coverStatus.textContent = error.message || "표지를 읽지 못했어요. 제목 칸에 직접 적어주세요.";
    } finally {
      state.coverRecognizing = false;
    }
  }

  function extractBookTitle(rawText) {
    const blocked = /isbn|publisher|publishing|written by|illustrated by|author|level|reading|copyright|www\.|\.com/i;
    const lines = String(rawText || "").split(/\n+/).map((line) => line.replace(/[^A-Za-z0-9'’:\-& ]+/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
    const candidates = lines.filter((line) => {
      const words = line.match(/[A-Za-z]+(?:['’][A-Za-z]+)?/g) || [];
      return words.length >= 1 && words.length <= 10 && line.length >= 3 && line.length <= 80 && !blocked.test(line);
    });
    if (!candidates.length) return "";
    return candidates.map((line, index) => {
      const letters = line.replace(/[^A-Za-z]/g, "");
      const uppercase = (letters.match(/[A-Z]/g) || []).length / Math.max(1, letters.length);
      return { line, score: Math.min(line.length, 42) + uppercase * 24 - index * 2 };
    }).sort((a, b) => b.score - a.score)[0].line;
  }

  function mergeSentenceItems(current, incoming) {
    const merged = current.slice();
    const seen = new Set(current.map((item) => String(item.sentence || "").trim().toLowerCase()).filter(Boolean));
    incoming.forEach((item) => {
      const key = String(item.sentence || "").trim().toLowerCase();
      if ((key && seen.has(key)) || merged.length >= MAX_BOOK_SENTENCES) return;
      if (key) seen.add(key);
      merged.push(item);
    });
    return merged;
  }

  function continueAddingPhotos() {
    ui.uploadView.hidden = false;
    ui.reviewView.hidden = state.sentences.length === 0;
    ui.step.textContent = "책 만들기 · 사진 계속 추가";
    selectPasteTarget("body");
    ui.bodyZone.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function analyzeImageWithGemini(mode, file) {
    const apiKey = ui.geminiKey.value.trim();
    if (!apiKey) {
      ui.geminiKey.focus({ preventScroll: true });
      throw new Error("화면 위쪽에 Gemini API 키를 먼저 입력해주세요.");
    }
    const dataUrl = await fileToDataUrl(file);
    const commaIndex = dataUrl.indexOf(",");
    try {
      return await window.geminiAnalyze({
        mode,
        apiKey,
        images: [{ mimeType: file.type || "image/jpeg", data: dataUrl.slice(commaIndex + 1) }]
      });
    } catch (error) {
      throw new Error(error.message || "Gemini가 사진을 분석하지 못했습니다.");
    }
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("붙여넣은 사진을 읽지 못했습니다."));
      reader.readAsDataURL(file);
    });
  }

  async function recognizePhotos() {
    if (!state.files.length || state.recognizing) return;
    const batch = state.files.splice(0, state.files.length);
    const translatorReady = prepareTranslator();
    state.recognizing = true;
    ui.recognize.disabled = true;
    ui.progress.hidden = false;
    updateProgress(0, "Gemini 사진 분석을 준비하는 중…");
    setMessage(ui.message, "");
    try {
      const found = [];
      for (let index = 0; index < batch.length; index += 1) {
        updateProgress(index / batch.length, `Gemini가 ${index + 1}번째 사진을 읽는 중…`);
        const result = await analyzeImageWithGemini("body", batch[index]);
        if (Array.isArray(result.sentences)) found.push(...result.sentences);
      }
      const analyzed = [];
      for (let index = 0; index < found.length; index += 1) {
        const item = await normalizeGeminiSentence(found[index], translatorReady);
        if (item) analyzed.push(item);
      }
      if (!analyzed.length) throw new Error("Gemini가 영어 본문 문장을 찾지 못했어요. 본문이 크게 보이도록 다시 찍어주세요.");
      updateProgress(1, "Gemini 문장 분석 완료");
      showReview(analyzed, { append: true });
      setMessage(ui.message, `Gemini가 현재 ${state.sentences.length}개의 문장을 분석했어요. 사진을 더 붙여넣거나 입력 완료를 눌러 저장하세요.`, true);
    } catch (error) {
      setMessage(ui.message, error.message || "사진을 읽는 중 문제가 생겼어요. 다시 시도해주세요.");
    } finally {
      state.recognizing = false;
      ui.recognize.disabled = state.files.length === 0;
      if (state.files.length) setMessage(ui.message, `추가한 사진 ${state.files.length}장이 기다리고 있어요. 문장 찾기 버튼을 눌러주세요.`, true);
    }
  }

  async function normalizeGeminiSentence(source, translatorReady) {
    const sentence = cleanSentence(source && source.sentence);
    if (getWords(sentence).length < 3) return null;
    const enriched = await enrichSentenceAutomatically({
      sentence,
      translation: String(source.translation || "").trim()
    }, translatorReady);
    const sentenceWords = getWords(sentence);
    const exactWord = (value) => {
      const wanted = String(value || "").toLowerCase();
      return sentenceWords.find((word) => word.toLowerCase() === wanted) || "";
    };
    const verb = exactWord(source.verb) || enriched.verb;
    const verbs = [];
    (Array.isArray(source.verbs) ? source.verbs : [verb]).forEach((value) => {
      const matched = exactWord(value);
      if (matched) verbs.push(matched);
    });
    if (!verbs.length && verb) verbs.push(verb);
    const preposition = exactWord(source.preposition) || enriched.preposition;
    const chunks = Array.isArray(source.chunks) ? source.chunks.map((chunk) => {
      const options = Array.isArray(chunk.options) ? chunk.options.map((value) => String(value || "").trim()).filter(Boolean).slice(0, 4) : [];
      const meaning = String(chunk.meaning || "").trim();
      let correctIndex = Number(chunk.correctIndex);
      if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length || options[correctIndex] !== meaning) correctIndex = options.indexOf(meaning);
      return {
        text: String(chunk.text || "").replace(/\s+([,.!?;:])/g, "$1").replace(/\s+/g, " ").trim(),
        meaning,
        role: String(chunk.role || "의미 덩어리").trim(),
        options,
        correctIndex
      };
    }).filter((chunk) => chunk.text && chunk.meaning) : [];
    const translation = String(source.translation || enriched.translation || "").trim();
    const sentenceOptions = Array.isArray(source.sentenceOptions)
      ? source.sentenceOptions.map((option) => String(option || "").trim()).filter(Boolean).slice(0, 4)
      : [];
    let sentenceCorrect = Number(source.sentenceCorrect);
    if (!Number.isInteger(sentenceCorrect) || sentenceCorrect < 0 || sentenceCorrect >= sentenceOptions.length || sentenceOptions[sentenceCorrect] !== translation) {
      sentenceCorrect = sentenceOptions.indexOf(translation);
    }
    return {
      ...enriched,
      sentence,
      translation,
      verb,
      verbs,
      verbMeaning: String(source.verbMeaning || enriched.verbMeaning || "").trim(),
      preposition,
      prepositionMeaning: preposition ? String(source.prepositionMeaning || enriched.prepositionMeaning || "").trim() : "",
      chunks,
      sentenceOptions,
      sentenceCorrect,
      wordGlosses: Array.isArray(source.wordGlosses) ? source.wordGlosses.map((item) => ({ word: String(item.word || "").trim(), meaning: String(item.meaning || "").trim() })).filter((item) => item.word && item.meaning) : [],
      idioms: Array.isArray(source.idioms) ? source.idioms.map((item) => ({ phrase: String(item.phrase || "").trim(), meaning: String(item.meaning || "").trim() })).filter((item) => item.phrase && item.meaning) : [],
      grammarPattern: String(source.grammarPattern || "").trim(),
      grammarExplanation: String(source.grammarExplanation || "").trim(),
      grammarGlosses: []
    };
  }

  function updateProgress(value, label) {
    const percent = Math.max(0, Math.min(100, Math.round(value * 100)));
    ui.progressBar.style.width = `${percent}%`;
    ui.percent.textContent = `${percent}%`;
    ui.status.textContent = label;
  }

  function extractEnglishSentences(rawText) {
    const rawLines = String(rawText || "").replace(/-\s*\n\s*/g, "").split(/\n+/).map((line) => line.trim()).filter(Boolean);
    const joined = rawLines.join(" ").replace(/[|_~`]/g, " ").replace(/\s+/g, " ");
    let candidates = joined.match(/["']?[A-Z][A-Za-z0-9,'’"()\-;:\s]{6,}?[.!?](?=\s+["']?[A-Z]|$)/g) || [];
    if (!candidates.length) candidates = rawLines;
    const seen = new Set();
    return candidates.map(cleanSentence).filter((sentence) => {
      const words = getWords(sentence);
      const key = sentence.toLowerCase();
      const latin = (sentence.match(/[A-Za-z]/g) || []).length / Math.max(1, sentence.length);
      if (words.length < 3 || words.length > 32 || latin < .55 || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 30);
  }

  function cleanSentence(value) {
    let sentence = String(value || "").replace(/[“”]/g, '"').replace(/[’]/g, "'").replace(/\s+([,.!?;:])/g, "$1").replace(/\s+/g, " ").trim();
    sentence = sentence.replace(/^[^A-Za-z"']+/, "");
    if (sentence && !/[.!?]$/.test(sentence)) sentence += ".";
    return sentence;
  }

  function getWords(sentence) {
    return String(sentence || "").match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || [];
  }

  function detectVerb(words) {
    const lower = words.map((word) => word.toLowerCase());
    const lexical = lower.find((word) => VERBS[word] && !AUXILIARIES.has(word));
    if (lexical) return words[lower.indexOf(lexical)];
    const known = lower.find((word) => VERBS[word]);
    if (known) return words[lower.indexOf(known)];
    const guessed = lower.find((word, index) => index > 0 && (/ed$|ing$/.test(word) || (/s$/.test(word) && word.length > 4)));
    if (guessed) return words[lower.indexOf(guessed)];
    if (words.length > 1) {
      const questionOffset = ["how", "what", "when", "where", "why", "who"].includes(lower[0]) ? 3 : 1;
      return words[Math.min(questionOffset, words.length - 1)];
    }
    return "";
  }

  function verbMeaning(word) {
    const lower = String(word || "").toLowerCase();
    if (VERBS[lower]) return VERBS[lower];
    const stems = [lower.replace(/ied$/, "y"), lower.replace(/ed$/, ""), lower.replace(/ing$/, ""), lower.replace(/es$/, ""), lower.replace(/s$/, "")];
    const stem = stems.find((item) => VERBS[item]);
    return stem ? VERBS[stem] : "";
  }

  function detectPreposition(words) {
    return words.find((word) => PREPOSITIONS[word.toLowerCase()]) || "";
  }

  function analyzeSentence(sentence) {
    const cleaned = cleanSentence(sentence);
    const words = getWords(cleaned);
    const verb = detectVerb(words);
    const preposition = detectPreposition(words);
    return {
      sentence: cleaned,
      translation: "",
      verb,
      verbMeaning: verbMeaning(verb),
      preposition,
      prepositionMeaning: preposition ? PREPOSITIONS[preposition.toLowerCase()] : "",
      grammarGlosses: []
    };
  }

  function prepareTranslator() {
    if (state.translatorPromise) return state.translatorPromise;
    if (state.translatorStatus !== "available" || !("Translator" in window) || typeof window.Translator.create !== "function") return Promise.resolve(null);
    try {
      state.translatorPromise = window.Translator.create({
        sourceLanguage: "en",
        targetLanguage: "ko"
      }).catch(() => null);
    } catch (_) {
      state.translatorPromise = Promise.resolve(null);
    }
    return state.translatorPromise;
  }

  function checkTranslatorAvailability() {
    if (!("Translator" in window) || typeof window.Translator.availability !== "function") {
      state.translatorStatus = "unavailable";
      return;
    }
    window.Translator.availability({ sourceLanguage: "en", targetLanguage: "ko" })
      .then((status) => { state.translatorStatus = status; })
      .catch(() => { state.translatorStatus = "unavailable"; });
  }

  async function analyzeSentencesAutomatically(sentences, translatorReady) {
    const results = [];
    for (let index = 0; index < sentences.length; index += 1) {
      const source = typeof sentences[index] === "string" ? { sentence: sentences[index] } : sentences[index];
      results.push(await enrichSentenceAutomatically(source, translatorReady));
      if (ui.progress && !ui.progress.hidden) updateProgress(.96 + ((index + 1) / sentences.length) * .04, `${index + 1}/${sentences.length} 문장 자동 분석 중…`);
    }
    return results;
  }

  async function enrichSentenceAutomatically(source, translatorReady) {
    const base = analyzeSentence(source.sentence || "");
    const translator = translatorReady || prepareTranslator();
    const translation = source.translation && String(source.translation).trim()
      ? String(source.translation).trim()
      : await translateEnglishToKorean(base.sentence, translator);
    const detectedMeaning = base.verbMeaning || (base.verb ? await translateEnglishToKorean(base.verb, translator) : "");
    return {
      ...source,
      ...base,
      translation: translation || fallbackKoreanTranslation(base.sentence),
      verbMeaning: detectedMeaning || "동작하거나 상태를 나타낸다",
      prepositionMeaning: base.prepositionMeaning,
      grammarGlosses: []
    };
  }

  async function translateEnglishToKorean(text, translatorReady) {
    const source = String(text || "").trim();
    if (!source) return "";
    const cacheKey = source.toLowerCase();
    if (translationCache.has(cacheKey)) return translationCache.get(cacheKey);
    try {
      const translator = await translatorReady;
      if (translator && typeof translator.translate === "function") {
        const localTranslation = String(await translator.translate(source) || "").trim();
        if (localTranslation) {
          translationCache.set(cacheKey, localTranslation);
          return localTranslation;
        }
      }
    } catch (_) { /* use the network fallback below */ }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      const endpoint = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(source.slice(0, 480))}&langpair=en%7Cko&mt=1`;
      const response = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timer);
      if (response.ok) {
        const data = await response.json();
        const translated = decodeHtml(data && data.responseData && data.responseData.translatedText).trim();
        if (translated && translated.toLowerCase() !== source.toLowerCase()) {
          translationCache.set(cacheKey, translated);
          return translated;
        }
      }
    } catch (_) { /* use the local dictionary fallback below */ }
    const fallback = fallbackKoreanTranslation(source);
    translationCache.set(cacheKey, fallback);
    return fallback;
  }

  function decodeHtml(value) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = String(value || "");
    return textarea.value;
  }

  function fallbackKoreanTranslation(sentence) {
    const source = String(sentence || "").trim();
    const feelingQuestion = source.match(/^How do you feel when you see (.+)\?$/i);
    if (feelingQuestion) {
      const noun = fallbackWordMeaning(feelingQuestion[1].replace(/[?.!]/g, "").trim());
      return `${noun}을(를) 볼 때 어떤 기분이 드나요?`;
    }
    const words = getWords(source);
    const translated = words.map(fallbackWordMeaning).filter(Boolean).join(" ");
    return `${translated || source}${/[?]$/.test(source) ? "?" : "."}`;
  }

  function fallbackWordMeaning(word) {
    const lower = String(word || "").toLowerCase();
    return AUTO_WORD_MEANINGS[lower] || WORD_MEANINGS[lower] || VERBS[lower] || PREPOSITIONS[lower] || lower;
  }

  function renderEditors() {
    ui.editors.innerHTML = "";
    ui.total.textContent = state.sentences.length;
    state.sentences.forEach((item, index) => ui.editors.appendChild(createEditor(item, index)));
  }

  function createEditor(item, index) {
    const card = document.createElement("article");
    card.className = "sentence-editor sentence-editor--simple";
    card.innerHTML = `
      <strong class="sentence-editor__number">${String(index + 1).padStart(2, "0")}</strong>
      <input class="sentence-editor__sentence" type="text" data-field="sentence" aria-label="${index + 1}번 영어 문장" placeholder="영어 문장을 입력하세요" />
      <button class="sentence-delete" type="button" aria-label="문장 삭제">×</button>`;
    const sentenceInput = card.querySelector('[data-field="sentence"]');
    sentenceInput.value = item.sentence;
    sentenceInput.addEventListener("input", () => {
      item.sentence = sentenceInput.value;
      item.translation = "";
      item.grammarGlosses = [];
    });
    sentenceInput.addEventListener("blur", async () => {
      card.classList.add("is-analyzing");
      const enriched = await enrichSentenceAutomatically({ ...item, sentence: sentenceInput.value }, prepareTranslator());
      Object.assign(item, enriched);
      sentenceInput.value = item.sentence;
      card.classList.remove("is-analyzing");
    });
    card.querySelector(".sentence-delete").addEventListener("click", () => {
      state.sentences.splice(index, 1);
      renderEditors();
    });
    return card;
  }

  function addSentence() {
    if (state.sentences.length >= MAX_BOOK_SENTENCES) {
      setMessage(ui.reviewMessage, `책에는 문장을 최대 ${MAX_BOOK_SENTENCES}개까지 넣을 수 있어요.`);
      return;
    }
    state.sentences.push(analyzeSentence(""));
    ui.uploadView.hidden = false;
    ui.reviewView.hidden = false;
    ui.step.textContent = "책 만들기 · 문장 확인";
    renderEditors();
    ui.screen.scrollTop = ui.screen.scrollHeight;
    const inputs = ui.editors.querySelectorAll(".sentence-editor__sentence");
    if (inputs.length) inputs[inputs.length - 1].focus();
  }

  function validateItems(items) {
    if (!items.length) return "문장을 한 개 이상 추가해주세요.";
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (getWords(item.sentence).length < 3) return `${index + 1}번 영어 문장을 확인해주세요.`;
      if (!item.translation.trim()) return `${index + 1}번 문장의 자동 해석을 다시 시도해주세요.`;
      if (!item.verb) return `${index + 1}번 문장에서 동사를 자동으로 찾지 못했어요.`;
      if (!item.verbMeaning.trim()) return `${index + 1}번 동사의 뜻을 자동으로 찾지 못했어요.`;
      if (item.preposition && !item.prepositionMeaning.trim()) return `${index + 1}번 전치사의 뜻을 자동으로 찾지 못했어요.`;
    }
    return "";
  }

  async function buildGame() {
    if (!state.sentences.length) {
      setMessage(ui.reviewMessage, "문장을 한 개 이상 추가해주세요.");
      return;
    }
    ui.build.disabled = true;
    setMessage(ui.reviewMessage, "문장을 저장하는 중…", true);
    const translatorReady = prepareTranslator();
    const prepared = [];
    for (const item of state.sentences) {
      const ready = item.translation && item.verb && item.verbMeaning && (!item.preposition || item.prepositionMeaning);
      prepared.push(ready ? item : await enrichSentenceAutomatically(item, translatorReady));
    }
    state.sentences = prepared;
    renderEditors();
    state.sourceMeta = {
      sourceTitle: String((ui.bookTitle && ui.bookTitle.value) || "").trim() || "My Reading Text",
      srLevel: "직접 입력"
    };
    saveBookDraft();
    const error = validateItems(state.sentences);
    if (error) {
      setMessage(ui.reviewMessage, `책은 임시 저장했어요. ${error}`);
      ui.build.disabled = false;
      return;
    }
    state.pendingStages = buildStages(state.sentences);
    try { localStorage.setItem("lostSignalHomework", JSON.stringify(state.sentences)); } catch (_) { /* local storage may be unavailable */ }
    ui.build.disabled = false;
    launchHomeworkGame();
  }

  function saveBookDraft() {
    const book = {
      title: state.sourceMeta.sourceTitle,
      srLevel: state.sourceMeta.srLevel,
      source: (ui.bookSource && ui.bookSource.value) || "기타",
      savedAt: new Date().toISOString(),
      sentences: state.sentences
    };
    try {
      const books = readStoredBooks();
      const match = books.findIndex((item) => item.title === book.title);
      if (match >= 0) books.splice(match, 1);
      books.unshift(book);
      localStorage.setItem("lostSignalHomeworkBooks", JSON.stringify(books.slice(0, 40)));
      localStorage.setItem("lostSignalHomeworkBook", JSON.stringify(book));
    } catch (_) { /* local storage may be unavailable */ }
    try { window.dispatchEvent(new Event("readinglab:books-changed")); } catch (_) { /* older browsers */ }
  }

  function readStoredBooks() {
    try {
      const list = JSON.parse(localStorage.getItem("lostSignalHomeworkBooks") || "null");
      if (Array.isArray(list)) return list.filter((item) => item && Array.isArray(item.sentences));
      const legacy = JSON.parse(localStorage.getItem("lostSignalHomeworkBook") || "null");
      return legacy && Array.isArray(legacy.sentences) ? [legacy] : [];
    } catch (_) {
      return [];
    }
  }

  function vocabularyLemma(word) {
    const lower = String(word || "").toLowerCase();
    if (WORD_MEANINGS[lower] || VERBS[lower]) return lower;
    const candidates = [
      lower.replace(/ies$/, "y"), lower.replace(/ied$/, "y"), lower.replace(/ing$/, ""),
      lower.replace(/ed$/, ""), lower.replace(/es$/, ""), lower.replace(/s$/, "")
    ];
    return candidates.find((candidate) => WORD_MEANINGS[candidate] || VERBS[candidate] || BASIC_WORDS.has(candidate)) || lower;
  }

  function vocabularyMeaning(word) {
    const lower = String(word || "").toLowerCase();
    const lemma = vocabularyLemma(lower);
    return WORD_MEANINGS[lower] || WORD_MEANINGS[lemma] || AUTO_WORD_MEANINGS[lower] || AUTO_WORD_MEANINGS[lemma] || VERBS[lower] || VERBS[lemma] || "";
  }

  function launchHomeworkGame() {
    prepareStageKeyWords();
    ui.screen.classList.remove("is-visible");
    if (typeof state.onStart === "function") state.onStart(state.pendingStages, state.sourceMeta);
    resetBookWorkspace();
  }

  function resetBookWorkspace() {
    state.previewUrls.forEach((url) => URL.revokeObjectURL(url));
    state.files = [];
    state.pageFiles = [];
    state.previewUrls = [];
    state.sentences = [];
    state.pendingStages = [];
    state.pasteTarget = "cover";
    state.sourceMeta = { sourceTitle: "My Reading Text", srLevel: "직접 입력" };

    ui.bookTitle.value = "";
    if (ui.bookSr) ui.bookSr.value = "";
    ui.coverStatus.textContent = "표지를 넣으면 인식한 제목이 위 칸에 자동으로 들어갑니다.";
    ui.coverStatus.classList.remove("is-good");
    ui.previews.replaceChildren();
    ui.editors.replaceChildren();
    ui.total.textContent = "0";
    ui.reviewView.hidden = true;
    ui.uploadView.hidden = false;
    ui.progress.hidden = true;
    ui.progressBar.style.width = "0%";
    ui.status.textContent = "글자 인식 준비 중…";
    ui.percent.textContent = "0%";
    ui.recognize.disabled = true;
    ui.build.disabled = false;
    ui.step.textContent = "책 만들기 · 사진 계속 추가";
    setMessage(ui.message, "");
    setMessage(ui.reviewMessage, "");
    ui.coverZone.classList.add("is-selected");
    ui.bodyZone.classList.remove("is-selected");
    ui.coverZone.setAttribute("aria-pressed", "true");
    ui.bodyZone.setAttribute("aria-pressed", "false");
  }

  function prepareStageKeyWords() {
    const verbMeanings = state.pendingStages.map((stage) => stage.verbMeaning).filter(Boolean);
    const meaningPool = [...verbMeanings];

    state.pendingStages.forEach((stage, index) => {
      const sentenceWords = getWords(stage.sentence).map((word) => word.toLowerCase());
      const excluded = new Set([String(stage.verb || "").toLowerCase(), String(stage.preposition || "").toLowerCase()]);
      const knownWord = sentenceWords.find((word) => {
        return !excluded.has(word) && !STOPWORDS.has(word) && !PREPOSITIONS[word] && !AUXILIARIES.has(word) && vocabularyMeaning(word);
      });
      const keyWord = knownWord || stage.verb;
      const keyWordMeaning = vocabularyMeaning(knownWord) || stage.verbMeaning;
      const keyWordOptions = makeOptions(keyWordMeaning, meaningPool, KEY_WORD_DISTRACTORS, index + 3);

      stage.keyWord = keyWord;
      stage.keyWordMeaning = keyWordMeaning;
      stage.keyWordOptions = keyWordOptions;
      stage.keyWordCorrect = keyWordOptions.indexOf(keyWordMeaning);
    });
  }

  function buildStages(items) {
    const translations = items.map((item) => item.translation.trim());
    const verbMeanings = items.map((item) => item.verbMeaning.trim());
    const prepMeanings = items.map((item) => item.prepositionMeaning.trim()).filter(Boolean);
    return items.map((item, index) => {
      const style = WORLD_STYLES[index % WORLD_STYLES.length];
      const geminiSentenceOptions = Array.isArray(item.sentenceOptions) ? item.sentenceOptions.map((option) => String(option || "").trim()).filter(Boolean) : [];
      const sentenceOptions = geminiSentenceOptions.length === 4 && geminiSentenceOptions.includes(item.translation.trim())
        ? geminiSentenceOptions
        : makeOptions(item.translation.trim(), translations, SENTENCE_DISTRACTORS, index);
      const verbOptions = makeOptions(item.verbMeaning.trim(), verbMeanings, VERB_DISTRACTORS, index + 1);
      const prepOptions = item.preposition ? makeOptions(item.prepositionMeaning.trim(), prepMeanings, PREPOSITION_DISTRACTORS, index + 2) : [];
      return {
        chapter: `HOMEWORK ${String(index + 1).padStart(2, "0")}`,
        location: style.location,
        title: `숙제 문장 ${index + 1}`,
        mission: `사진 속 문장 ${index + 1}을 해독하라`,
        speaker: "숙제 안내자",
        dialogue: `사진에서 찾은 ${index + 1}번째 문장이야. 천천히 읽으면 답이 보여.`,
        sentence: item.sentence.trim(),
        verb: item.verb,
        verbs: Array.isArray(item.verbs) && item.verbs.length ? item.verbs.slice() : [item.verb],
        verbMeaning: item.verbMeaning.trim(),
        verbOptions,
        verbCorrect: verbOptions.indexOf(item.verbMeaning.trim()),
        preposition: item.preposition,
        prepositionMeaning: item.prepositionMeaning.trim(),
        prepositionOptions: prepOptions,
        prepositionCorrect: item.preposition ? prepOptions.indexOf(item.prepositionMeaning.trim()) : -1,
        sentenceMeaning: item.translation.trim(),
        chunks: Array.isArray(item.chunks) ? item.chunks.map((chunk) => ({ ...chunk, options: Array.isArray(chunk.options) ? chunk.options.slice() : [] })) : [],
        grammarPattern: String(item.grammarPattern || "").trim(),
        grammarExplanation: String(item.grammarExplanation || "").trim(),
        grammarGlosses: Array.isArray(item.grammarGlosses) ? item.grammarGlosses.slice() : [],
        wordGlosses: Array.isArray(item.wordGlosses) ? item.wordGlosses.map((entry) => ({ ...entry })) : [],
        idioms: Array.isArray(item.idioms) ? item.idioms.map((entry) => ({ ...entry })) : [],
        sentenceOptions,
        sentenceCorrect: sentenceOptions.indexOf(item.translation.trim()),
        palette: { ...style.palette },
        world: style.world,
        transition: index === items.length - 1 ? "사진 속 숙제 본문을 모두 해독했어요!" : "정답이에요. 사진 속 다음 문장을 향해 출발합니다."
      };
    });
  }

  function makeOptions(correct, pool, fallback, seed) {
    const unique = [];
    [...pool, ...fallback].forEach((value) => {
      const cleaned = String(value || "").trim();
      if (cleaned && cleaned !== correct && !unique.includes(cleaned)) unique.push(cleaned);
    });
    const base = [correct, ...unique.slice(0, 3)];
    const rotation = Math.abs(hashCode(correct) + seed) % 4;
    return base.map((_, index) => base[(index + rotation) % 4]);
  }

  function hashCode(value) {
    return Array.from(String(value)).reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
  }

  function setMessage(element, message, good) {
    element.textContent = message;
    element.classList.toggle("is-good", Boolean(good));
  }

  window.HomeworkBuilder = { init, open, extractEnglishSentences, analyzeSentence, buildStages, vocabularyMeaning };
})();
