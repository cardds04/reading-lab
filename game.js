(function () {
  "use strict";

  const originalStory = window.LOST_SIGNAL_STORY;
  let story = originalStory;
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const ui = {
    game: $("#game"),
    title: $("#title-screen"),
    intro: $("#intro-screen"),
    introLine: $("#intro-line"),
    introCount: $("#intro-count"),
    introNext: $("#intro-next"),
    hud: $("#hud"),
    guide: $("#guide-card"),
    guideIcon: $("#guide-icon"),
    guideTitle: $("#guide-title"),
    guideText: $("#guide-text"),
    location: $("#hud-location"),
    chapter: $("#hud-chapter"),
    count: $("#hud-count"),
    progress: $("#hud-progress-bar"),
    peace: $("#peace-count"),
    speech: $("#speech-bubble"),
    speaker: $("#speaker"),
    speechText: $("#speech-text"),
    mission: $("#mission-panel"),
    missionNumber: $("#mission-number"),
    missionTitle: $("#mission-title"),
    verbStep: $("#verb-step"),
    meaningStep: $("#meaning-step"),
    prepositionStep: $("#preposition-step"),
    prepositionMeaningStep: $("#preposition-meaning-step"),
    sentenceMeaningStep: $("#sentence-meaning-step"),
    grammarStep: $("#grammar-step"),
    keyWordStep: $("#key-word-step"),
    words: $("#sentence-words"),
    sentenceTranslation: $("#mission-sentence-translation"),
    sentenceTranslationText: $("#mission-sentence-translation-text"),
    missionStatus: $("#mission-progress-status"),
    missionStatusLabel: $("#mission-status-label"),
    missionStatusWord: $("#mission-status-word"),
    missionStatusDetail: $("#mission-status-detail"),
    answers: $("#answer-list"),
    prepositionAnswers: $("#preposition-answer-list"),
    sentenceAnswers: $("#sentence-answer-list"),
    keyWordAnswers: $("#key-word-answer-list"),
    grammarStepNumber: $("#grammar-step-number"),
    grammarExpression: $("#grammar-expression"),
    grammarNext: $("#grammar-next"),
    sentenceStepNumber: $("#sentence-step-number"),
    sentenceChunkPrompt: $("#sentence-chunk-prompt"),
    keyWordStepNumber: $("#key-word-step-number"),
    feedback: $("#mission-feedback"),
    transition: $("#transition-card"),
    transitionTitle: $("#transition-title"),
    transitionCopy: $("#transition-copy"),
    ending: $("#ending-screen"),
    endingPeace: $("#ending-peace"),
    endingWords: $("#ending-words"),
    endingScore: $("#ending-score"),
    endingStory: $("#ending-story"),
    endingLessonLabel: $("#ending-lesson-label"),
    endingLessonText: $("#ending-lesson-text"),
    toast: $("#toast"),
    flash: $("#flash")
  };

  const introLines = [
    "언제부터였을까. 루의 마을에서 웃음소리와 다정한 인사가 하나씩 사라졌다.",
    "사람들의 눈에는 푸른 화면만 비쳤고, 루 역시 소중한 순간들을 놓치고 있었다.",
    "잃어버린 사랑과 평화를 찾기 위해, 루는 빛의 흔적을 따라 마을 밖으로 향했다."
  ];

  const KEY_WORD_DISTRACTORS = ["마을", "숲", "평화", "빛", "친구", "기억", "시간", "길"];
  const CHUNK_MEANING_DISTRACTORS = ["문장의 주인공", "동작을 나타내는 말", "동작의 대상", "장소를 나타내는 말", "시간을 나타내는 말", "상태를 설명하는 말"];
  const BE_VERBS = new Set(["am", "is", "are", "was", "were", "be", "been", "being"]);
  const QUESTION_AUXILIARIES = new Set(["am", "is", "are", "was", "were", "do", "does", "did", "have", "has", "had", "can", "could", "will", "would", "should", "may", "might", "must"]);
  const COMMON_PREPOSITIONS = new Set(["at", "in", "on", "from", "to", "with", "for", "of", "by", "about", "under", "over", "through", "beside", "between", "among", "before", "after", "into", "near", "behind", "across", "around", "during", "without", "toward", "against"]);
  const TO_INFINITIVE_HEADS = new Set(["want", "wants", "wanted", "need", "needs", "needed", "hope", "hopes", "hoped", "plan", "plans", "planned", "try", "tries", "tried", "decide", "decides", "decided", "choose", "chooses", "chose", "learn", "learns", "learned", "ask", "asks", "asked", "tell", "tells", "told", "like", "likes", "liked", "love", "loves", "begin", "begins", "start", "starts"]);
  const GRAMMAR_EXPRESSIONS = [
    { phrase: "look for", meaning: "look for는 ‘~을 찾다’라는 숙어예요." },
    { phrase: "take care of", meaning: "take care of는 ‘~을 돌보다’라는 숙어예요." },
    { phrase: "be interested in", meaning: "be interested in은 ‘~에 관심이 있다’라는 표현이에요." },
    { phrase: "be good at", meaning: "be good at은 ‘~을 잘하다’라는 표현이에요." },
    { phrase: "have to", meaning: "have to 뒤에는 동사원형이 오며 ‘~해야 한다’라는 뜻이에요." },
    { phrase: "used to", meaning: "used to 뒤에는 동사원형이 오며 ‘예전에 ~하곤 했다’라는 뜻이에요." },
    { phrase: "as well as", meaning: "as well as는 ‘~뿐만 아니라’라는 연결 표현이에요." },
    { phrase: "because of", meaning: "because of 뒤에는 명사가 오며 ‘~때문에’라고 해석해요." },
    { phrase: "in order to", meaning: "in order to 뒤에는 동사원형이 오며 ‘~하기 위해’라고 해석해요." },
    { phrase: "at sunset", meaning: "at sunset은 ‘해 질 무렵에’라는 시간 표현이에요." },
    { phrase: "screen time", meaning: "screen time은 ‘화면을 사용하는 시간’을 뜻하는 자주 쓰는 표현이에요." }
  ];
  const NATURAL_ENGLISH_VOICE_NAMES = [
    /Microsoft (Ava|Jenny|Aria|Guy).*Natural/i,
    /^Google US English$/i,
    /^Samantha$/i,
    /^Ava/i,
    /^Alex$/i,
    /^Daniel$/i,
    /^Karen$/i,
    /^Moira$/i,
    /^Tessa$/i
  ];
  const NOVELTY_VOICE_NAMES = /Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Fred|Good News|Jester|Junior|Kathy|Organ|Ralph|Superstar|Trinoids|Whisper|Wobble|Zarvox/i;

  const state = {
    phase: "title",
    stage: 0,
    peace: 0,
    mistakes: 0,
    stageMistakes: 0,
    introIndex: 0,
    sound: true,
    cameraClose: false,
    lateral: 0,
    lateralTarget: 0,
    jumping: false,
    jumpVelocity: 0,
    travelSpeed: 0.52,
    transitionTimer: null,
    customMode: false,
    sentenceChunkQuiz: null
  };

  let scene;
  let camera;
  let renderer;
  let clock;
  let hero;
  let phone;
  let world;
  let pathSegments = [];
  let props = [];
  let particles;
  let ambientLight;
  let sunLight;
  let pathMaterial;
  let groundMaterial;
  let audioContext;
  let sentenceSpeechTimer;

  init3D();
  bindUI();
  applyWorld(story[0], true);
  animate();

  function init3D() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(story[0].palette.sky);
    scene.fog = new THREE.FogExp2(story[0].palette.fog, 0.016);

    camera = new THREE.PerspectiveCamera(49, innerWidth / innerHeight, 0.1, 260);
    camera.position.set(0, 4.35, 11.8);
    camera.lookAt(0, 1.55, -3.4);

    renderer = new THREE.WebGLRenderer({ canvas: $("#world"), antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    clock = new THREE.Clock();
    world = new THREE.Group();
    scene.add(world);

    ambientLight = new THREE.HemisphereLight(0xd8efff, 0x263128, 1.5);
    scene.add(ambientLight);
    sunLight = new THREE.DirectionalLight(0xffe5bc, 2.1);
    sunLight.position.set(-8, 16, 8);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1024, 1024);
    sunLight.shadow.camera.left = -12;
    sunLight.shadow.camera.right = 12;
    sunLight.shadow.camera.top = 12;
    sunLight.shadow.camera.bottom = -12;
    scene.add(sunLight);

    createGroundAndPath();
    hero = createHero();
    hero.position.set(3.2, 0, 1.3);
    scene.add(hero);
    phone = createPhone();
    phone.visible = false;
    scene.add(phone);
    createParticles();

    window.addEventListener("resize", onResize);
  }

  function material(color, roughness = 0.82, metalness = 0) {
    return new THREE.MeshStandardMaterial({ color, roughness, metalness, flatShading: true });
  }

  function mesh(geometry, mat, shadows = true) {
    const item = new THREE.Mesh(geometry, mat);
    item.castShadow = shadows;
    item.receiveShadow = shadows;
    return item;
  }

  function createGroundAndPath() {
    groundMaterial = material(story[0].palette.ground, 1);
    const ground = mesh(new THREE.PlaneGeometry(180, 280), groundMaterial, false);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.08, -112);
    ground.receiveShadow = true;
    world.add(ground);

    pathMaterial = material(story[0].palette.path, 1);
    for (let i = 0; i < 40; i += 1) {
      const segment = mesh(new THREE.PlaneGeometry(6.5, 5.25), pathMaterial, false);
      segment.rotation.x = -Math.PI / 2;
      segment.position.set(pathX(-i * 5), 0, 6 - i * 5.1);
      segment.receiveShadow = true;
      segment.userData.row = i;
      pathSegments.push(segment);
      world.add(segment);
    }
  }

  function createHero() {
    const group = new THREE.Group();
    const skin = material(0xe0a37f);
    const navy = material(0x203052);
    const jacket = material(0xe88755);
    const denim = material(0x36577a);
    const boot = material(0x16202d);
    const hair = material(0x2b2023);
    const bag = material(0x8f5c3d);
    const scarf = material(0xffcf71);

    const torso = mesh(new THREE.BoxGeometry(1.02, 1.35, 0.55), jacket);
    torso.position.y = 2.05;
    torso.rotation.x = -0.04;
    group.add(torso);

    const shirt = mesh(new THREE.BoxGeometry(0.62, 0.65, 0.59), navy);
    shirt.position.set(0, 2.18, -0.02);
    group.add(shirt);

    const head = mesh(new THREE.IcosahedronGeometry(0.53, 2), skin);
    head.scale.set(0.9, 1.04, 0.88);
    head.position.y = 3.15;
    group.add(head);

    const hairCap = mesh(new THREE.SphereGeometry(0.52, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.62), hair);
    hairCap.scale.set(0.92, 0.72, 0.9);
    hairCap.position.set(0, 3.42, 0.02);
    group.add(hairCap);
    for (let i = -2; i <= 2; i += 1) {
      const tuft = mesh(new THREE.ConeGeometry(0.16, 0.4, 4), hair);
      tuft.position.set(i * 0.17, 3.47 - Math.abs(i) * 0.04, -0.35);
      tuft.rotation.x = 1.2;
      group.add(tuft);
    }

    const backpack = mesh(new THREE.BoxGeometry(0.88, 1.05, 0.36), bag);
    backpack.position.set(0, 2.12, 0.43);
    backpack.rotation.x = 0.05;
    group.add(backpack);
    const flap = mesh(new THREE.BoxGeometry(0.77, 0.29, 0.08), material(0xa76c48));
    flap.position.set(0, 2.38, 0.65);
    group.add(flap);

    const scarfBand = mesh(new THREE.TorusGeometry(0.36, 0.09, 5, 12), scarf);
    scarfBand.rotation.x = Math.PI / 2;
    scarfBand.position.y = 2.7;
    group.add(scarfBand);
    const scarfTail = mesh(new THREE.BoxGeometry(0.22, 0.8, 0.08), scarf);
    scarfTail.position.set(0.27, 2.46, 0.45);
    scarfTail.rotation.z = -0.18;
    scarfTail.name = "scarf";
    group.add(scarfTail);

    const limbPivot = (name, x, y, geometry, mat) => {
      const pivot = new THREE.Group();
      pivot.name = name;
      pivot.position.set(x, y, 0);
      const part = mesh(geometry, mat);
      part.position.y = -geometry.parameters.height / 2;
      pivot.add(part);
      group.add(pivot);
      return pivot;
    };

    limbPivot("leftArm", -0.64, 2.52, new THREE.CylinderGeometry(0.13, 0.11, 1.18, 7), jacket);
    limbPivot("rightArm", 0.64, 2.52, new THREE.CylinderGeometry(0.13, 0.11, 1.18, 7), jacket);
    limbPivot("leftLeg", -0.25, 1.45, new THREE.CylinderGeometry(0.18, 0.15, 1.18, 7), denim);
    limbPivot("rightLeg", 0.25, 1.45, new THREE.CylinderGeometry(0.18, 0.15, 1.18, 7), denim);

    const leftBoot = mesh(new THREE.BoxGeometry(0.36, 0.27, 0.56), boot);
    leftBoot.position.set(-0.25, 0.17, -0.12);
    group.add(leftBoot);
    const rightBoot = leftBoot.clone();
    rightBoot.position.x = 0.25;
    group.add(rightBoot);

    group.scale.setScalar(0.82);
    group.traverse((child) => { if (child.isMesh) child.castShadow = true; });
    return group;
  }

  function createPhone() {
    const group = new THREE.Group();
    const body = mesh(new THREE.BoxGeometry(0.78, 1.3, 0.18), material(0x141925, .3, .35));
    group.add(body);
    const screen = mesh(new THREE.PlaneGeometry(0.63, 1.06), new THREE.MeshStandardMaterial({ color: 0x55dfff, emissive: 0x1d7590, emissiveIntensity: 1.5 }));
    screen.position.z = 0.096;
    screen.name = "phoneScreen";
    group.add(screen);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    [-0.14, 0.14].forEach((x) => {
      const eye = mesh(new THREE.CircleGeometry(0.045, 12), eyeMat, false);
      eye.position.set(x, 0.13, 0.105);
      group.add(eye);
    });
    const glow = mesh(new THREE.RingGeometry(0.78, 0.83, 32), new THREE.MeshBasicMaterial({ color: 0x62e6ff, transparent: true, opacity: .33, side: THREE.DoubleSide }), false);
    glow.position.z = -0.02;
    glow.scale.y = 1.2;
    group.add(glow);
    group.scale.setScalar(.72);
    return group;
  }

  function createParticles() {
    const positions = [];
    for (let i = 0; i < 260; i += 1) {
      positions.push((Math.random() - .5) * 50, Math.random() * 13 + .4, -Math.random() * 120 + 8);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const particleMaterial = new THREE.PointsMaterial({ color: story[0].palette.accent, size: .08, transparent: true, opacity: .7, depthWrite: false });
    particles = new THREE.Points(geometry, particleMaterial);
    world.add(particles);
  }

  function clearProps() {
    props.forEach((item) => {
      world.remove(item);
      item.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material && child.material !== pathMaterial && child.material !== groundMaterial) child.material.dispose();
      });
    });
    props = [];
  }

  function applyWorld(stage, instant) {
    clearProps();
    const palette = stage.palette;
    const duration = instant ? 1 : 40;
    tweenColor(scene.background, palette.sky, duration);
    tweenColor(scene.fog.color, palette.fog, duration);
    tweenColor(groundMaterial.color, palette.ground, duration);
    tweenColor(pathMaterial.color, palette.path, duration);
    tweenColor(particles.material.color, palette.accent, duration);
    document.documentElement.style.setProperty("--accent", `#${new THREE.Color(palette.accent).getHexString()}`);

    for (let i = 0; i < 34; i += 1) {
      const z = 5 - i * 5.7 - Math.random() * 2;
      const side = i % 2 === 0 ? -1 : 1;
      const x = pathX(z) + side * (5.5 + Math.random() * 10);
      let prop;
      if (stage.world === "village" || stage.world === "home") prop = i % 3 === 0 ? makeHouse(stage.world === "home") : makeTree(stage.world === "home" ? 0x4f8b67 : 0x355c54);
      else if (stage.world === "forest") prop = i % 4 ? makeTree(i % 3 === 0 ? 0x2d7865 : 0x285448, 1.2) : makeFireflyTotem();
      else if (stage.world === "notifications") prop = i % 3 ? makeNotification(i) : makeRock(0x412455, 2.1);
      else if (stage.world === "memory") prop = i % 3 === 0 ? makeMemoryFrame() : makeTree(0x3f5f78);
      else if (stage.world === "canyon") prop = i % 5 === 0 ? makeCrystal() : makeRock(0x263149, 2.7);
      else if (stage.world === "shore") prop = i % 4 === 0 ? makeLamp() : makeRock(0x556f76, 1.15);
      else prop = makeTree(0x3f775a);
      prop.position.set(x, 0, z);
      prop.userData.baseZ = z;
      prop.userData.side = side;
      prop.userData.spin = stage.world === "notifications" || stage.world === "memory";
      props.push(prop);
      world.add(prop);
    }

    phone.visible = state.stage >= 2 && state.phase !== "title";
    const screen = phone.getObjectByName("phoneScreen");
    if (screen) {
      const hostile = state.stage === 2;
      screen.material.color.setHex(hostile ? 0xff3d83 : 0x55dfff);
      screen.material.emissive.setHex(hostile ? 0xa30b42 : 0x1d7590);
    }
  }

  function tweenColor(color, targetHex, steps) {
    if (steps <= 1) { color.setHex(targetHex); return; }
    const start = color.clone();
    const target = new THREE.Color(targetHex);
    let frame = 0;
    function tick() {
      frame += 1;
      color.lerpColors(start, target, Math.min(1, frame / steps));
      if (frame < steps) requestAnimationFrame(tick);
    }
    tick();
  }

  function makeTree(color, scale = 1) {
    const group = new THREE.Group();
    const trunk = mesh(new THREE.CylinderGeometry(.2, .3, 2.5, 6), material(0x604638));
    trunk.position.y = 1.25;
    group.add(trunk);
    const crownMat = material(color);
    for (let i = 0; i < 3; i += 1) {
      const crown = mesh(new THREE.ConeGeometry(1.2 - i * .17, 2.5, 7), crownMat);
      crown.position.y = 2.6 + i * .86;
      group.add(crown);
    }
    group.scale.setScalar((.72 + Math.random() * .65) * scale);
    group.rotation.y = Math.random() * Math.PI;
    return group;
  }

  function makeHouse(home) {
    const group = new THREE.Group();
    const wallColors = home ? [0xe6b27b, 0xd7876f, 0xe0c08c] : [0x8d776c, 0x777f7b, 0xa28772];
    const body = mesh(new THREE.BoxGeometry(3.2, 2.5, 3), material(wallColors[Math.floor(Math.random() * wallColors.length)]));
    body.position.y = 1.25;
    group.add(body);
    const roof = mesh(new THREE.ConeGeometry(2.6, 1.5, 4), material(home ? 0x8e4b45 : 0x4d4b4d));
    roof.position.y = 3.18;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);
    const windowMat = new THREE.MeshStandardMaterial({ color: home ? 0xffd879 : 0x6e91a0, emissive: home ? 0x9d5f16 : 0x1e3946, emissiveIntensity: 1.4 });
    const windowMesh = mesh(new THREE.PlaneGeometry(.72, .72), windowMat, false);
    windowMesh.position.set(0, 1.45, 1.505);
    group.add(windowMesh);
    group.scale.setScalar(.72 + Math.random() * .3);
    return group;
  }

  function makeRock(color, scale) {
    const rock = mesh(new THREE.DodecahedronGeometry(1, 0), material(color));
    rock.scale.set((.65 + Math.random()) * scale, (.7 + Math.random() * 1.4) * scale, (.7 + Math.random()) * scale);
    rock.position.y = rock.scale.y * .55;
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    return rock;
  }

  function makeNotification(index) {
    const group = new THREE.Group();
    const colors = [0xff467e, 0x7a68ff, 0x44d8ff];
    const mat = new THREE.MeshStandardMaterial({ color: colors[index % colors.length], emissive: colors[index % colors.length], emissiveIntensity: .75, roughness: .35 });
    const tile = mesh(new THREE.BoxGeometry(1.25, 1.25, .18), mat);
    tile.rotation.z = Math.PI / 4;
    group.add(tile);
    const dot = mesh(new THREE.SphereGeometry(.18, 8, 8), material(0xffffff), false);
    dot.position.set(.25, .25, .16);
    group.add(dot);
    group.position.y = 1.8 + Math.random() * 4.5;
    group.rotation.y = Math.random() * Math.PI;
    return group;
  }

  function makeMemoryFrame() {
    const group = new THREE.Group();
    const frameMat = material(0xe5bf79, .4, .2);
    const top = mesh(new THREE.BoxGeometry(2.4, .16, .15), frameMat);
    top.position.y = 2.6;
    group.add(top);
    const bottom = top.clone(); bottom.position.y = .65; group.add(bottom);
    [-1.12, 1.12].forEach((x) => {
      const side = mesh(new THREE.BoxGeometry(.16, 2.1, .15), frameMat);
      side.position.set(x, 1.62, 0);
      group.add(side);
    });
    const glow = mesh(new THREE.PlaneGeometry(2.1, 1.75), new THREE.MeshBasicMaterial({ color: 0x82b9ff, transparent: true, opacity: .16, side: THREE.DoubleSide }), false);
    glow.position.y = 1.62;
    group.add(glow);
    group.position.y = .1 + Math.random() * 2;
    return group;
  }

  function makeCrystal() {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x64dfff, emissive: 0x1e7090, emissiveIntensity: 1.3, roughness: .25 });
    for (let i = 0; i < 3; i += 1) {
      const crystal = mesh(new THREE.OctahedronGeometry(.45 + i * .1), mat);
      crystal.scale.y = 2 + i * .4;
      crystal.position.set((i - 1) * .55, .65 + i * .18, 0);
      crystal.rotation.z = (i - 1) * .2;
      group.add(crystal);
    }
    return group;
  }

  function makeLamp() {
    const group = new THREE.Group();
    const pole = mesh(new THREE.CylinderGeometry(.08, .12, 3, 7), material(0x273847, .5, .35));
    pole.position.y = 1.5;
    group.add(pole);
    const lamp = mesh(new THREE.IcosahedronGeometry(.35, 1), new THREE.MeshStandardMaterial({ color: 0xd8fbff, emissive: 0x70c7d8, emissiveIntensity: 1.5 }));
    lamp.position.y = 3.2;
    group.add(lamp);
    return group;
  }

  function makeFireflyTotem() {
    const group = new THREE.Group();
    const stone = makeRock(0x315449, .7);
    group.add(stone);
    const glow = mesh(new THREE.SphereGeometry(.18, 8, 8), new THREE.MeshStandardMaterial({ color: 0xa8ffe2, emissive: 0x57cba5, emissiveIntensity: 2 }));
    glow.position.y = 2.2;
    group.add(glow);
    return group;
  }

  function pathX(z) {
    return Math.sin(z * .045) * 1.2 + Math.sin(z * .013) * 1.7;
  }

  function bindUI() {
    $("#start-button").addEventListener("click", startIntro);
    ui.introNext.addEventListener("click", advanceIntro);
    $("#restart-button").addEventListener("click", restart);
    $("#camera-button").addEventListener("click", toggleCamera);
    ui.grammarNext.addEventListener("click", acknowledgeGrammar);
    [$("#sound-button"), $("#title-sound")].forEach((button) => button.addEventListener("click", toggleSound));
    if (window.HomeworkBuilder) window.HomeworkBuilder.init({ onStart: startHomeworkGame });

    window.addEventListener("keydown", (event) => {
      if (["ArrowLeft", "ArrowRight", " ", "a", "A", "d", "D"].includes(event.key)) event.preventDefault();
      const canTravel = state.travelSpeed > .05 && state.phase !== "title";
      if (canTravel && (event.key === "ArrowLeft" || event.key.toLowerCase() === "a")) state.lateralTarget = -1.6;
      if (canTravel && (event.key === "ArrowRight" || event.key.toLowerCase() === "d")) state.lateralTarget = 1.6;
      if (event.key === " " && !state.jumping && canTravel) {
        state.jumping = true;
        state.jumpVelocity = 4.9;
        playTone(420, .08, "sine", .05);
      }
    });
    window.addEventListener("keyup", (event) => {
      if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D"].includes(event.key)) state.lateralTarget = 0;
    });
  }

  function startIntro() {
    story = originalStory;
    state.customMode = false;
    initAudio();
    playTone(220, .18, "sine", .06);
    setTimeout(() => playTone(330, .22, "sine", .045), 110);
    state.phase = "intro";
    state.introIndex = 0;
    ui.title.classList.remove("is-visible");
    ui.intro.classList.add("is-visible");
    hero.position.x = 0;
    renderIntroLine();
  }

  function startHomeworkGame(stages) {
    if (!Array.isArray(stages) || !stages.length) return;
    clearTimeout(state.transitionTimer);
    story = stages;
    state.customMode = true;
    state.stage = 0;
    state.peace = 0;
    state.mistakes = 0;
    state.stageMistakes = 0;
    state.phase = "mission";
    state.travelSpeed = 0;
    state.lateral = 0;
    state.lateralTarget = 0;
    state.jumping = false;
    state.jumpVelocity = 0;
    hero.position.x = 0;
    ui.title.classList.remove("is-visible");
    ui.intro.classList.remove("is-visible");
    ui.ending.classList.remove("is-visible");
    ui.hud.classList.add("is-visible");
    ui.guide.classList.add("is-visible");
    ui.peace.textContent = "0";
    ui.progress.style.width = "0%";
    startStage(0);
  }

  function renderIntroLine() {
    ui.introCount.textContent = `0${state.introIndex + 1} / 03`;
    ui.introLine.textContent = introLines[state.introIndex];
    ui.introLine.style.animation = "none";
    requestAnimationFrame(() => { ui.introLine.style.animation = ""; });
    ui.introNext.innerHTML = state.introIndex === introLines.length - 1 ? "첫 미션 시작 <b>→</b>" : "계속하기 <b>→</b>";
  }

  function advanceIntro() {
    playTone(300 + state.introIndex * 50, .08, "sine", .035);
    if (state.introIndex < introLines.length - 1) {
      state.introIndex += 1;
      renderIntroLine();
      return;
    }
    ui.intro.classList.remove("is-visible");
    ui.hud.classList.add("is-visible");
    ui.guide.classList.add("is-visible");
    startStage(0);
  }

  function startStage(index) {
    state.stage = index;
    state.stageMistakes = 0;
    state.phase = "mission";
    state.travelSpeed = 0;
    state.lateralTarget = 0;
    state.jumping = false;
    state.jumpVelocity = 0;
    setTravelGuide(false);
    const stage = story[index];
    applyWorld(stage, false);
    updateHud();
    renderMission(stage);
    ui.speaker.textContent = stage.speaker.toUpperCase();
    ui.speechText.textContent = stage.dialogue;
    ui.speech.classList.add("is-visible");
    ui.mission.classList.add("is-visible");
    setTimeout(() => ui.speech.classList.remove("is-visible"), 5200);
    speakMissionSentence(stage.sentence);
  }

  function renderMission(stage) {
    ui.mission.classList.add("has-sentence-anchor");
    ui.missionNumber.textContent = `MISSION ${String(state.stage + 1).padStart(2, "0")}`;
    ui.missionTitle.textContent = stage.mission;
    ui.verbStep.classList.add("is-active");
    ui.meaningStep.classList.remove("is-active");
    ui.prepositionStep.classList.remove("is-active");
    ui.prepositionMeaningStep.classList.remove("is-active");
    ui.sentenceMeaningStep.classList.remove("is-active");
    ui.grammarStep.classList.remove("is-active");
    ui.keyWordStep.classList.remove("is-active");
    ui.mission.classList.remove("is-grammar");
    ui.feedback.textContent = "";
    ui.feedback.className = "mission-feedback";
    ui.words.innerHTML = "";
    ui.sentenceTranslation.className = "mission-sentence-translation is-pending";
    ui.sentenceTranslationText.textContent = "정답을 맞히면 여기에 해석이 표시돼요.";
    ui.answers.innerHTML = "";
    ui.prepositionAnswers.innerHTML = "";
    ui.sentenceAnswers.innerHTML = "";
    ui.keyWordAnswers.innerHTML = "";
    ui.grammarExpression.textContent = "";
    ui.sentenceStepNumber.textContent = `${stage.preposition ? "05" : "03"}-1`;
    ui.sentenceChunkPrompt.textContent = "문장을 끊어 읽으며 각 부분의 뜻을 골라보세요.";
    ui.grammarStepNumber.textContent = stage.preposition ? "06" : "04";
    ui.keyWordStepNumber.textContent = stage.preposition ? "07" : "05";
    state.sentenceChunkQuiz = null;
    setMissionStatus("STEP 01", "READY", "문장에서 동사를 찾아보세요.");
    ui.mission.scrollTop = 0;
    updateFocus();

    renderMissionSentence(stage, "verb");
  }

  function setMissionStatus(label, word, detail, complete) {
    ui.missionStatusLabel.textContent = label;
    ui.missionStatusWord.textContent = word;
    ui.missionStatusDetail.textContent = detail;
    ui.missionStatus.classList.toggle("is-complete", Boolean(complete));
  }

  function renderMissionSentence(stage, mode, grammarGuide) {
    const verbFound = mode !== "verb";
    const prepositionFound = Boolean(stage.preposition) && ["preposition-meaning", "sentence-meaning", "translated", "grammar", "key-word"].includes(mode);
    const keyWordFound = mode === "key-word";
    const handler = mode === "verb" ? chooseVerb : mode === "preposition" ? choosePreposition : null;
    const verb = String(stage.verb || "").toLowerCase();
    const preposition = String(stage.preposition || "").toLowerCase();
    const keyWord = String(stage.keyWord || "").toLowerCase();

    ui.words.className = "sentence-words";
    ui.words.style.removeProperty("--part-count");
    ui.words.setAttribute("role", "group");
    ui.words.setAttribute("aria-label", "미션 동안 고정되는 영어 문장");
    ui.words.replaceChildren();

    if ((mode === "grammar" || mode === "sentence-chunks") && grammarGuide) {
      ui.words.classList.add("is-structure-map");
      ui.words.style.setProperty("--part-count", grammarGuide.parts.length);
      ui.words.setAttribute("role", "list");
      ui.words.setAttribute("aria-label", "문장 성분과 뜻이 표시된 영어 문장");
      grammarGuide.parts.forEach((part, index) => {
        const revealed = mode === "grammar" || Boolean(grammarGuide.revealed && grammarGuide.revealed[index]);
        const box = document.createElement("div");
        box.className = "sentence-structure-part";
        box.classList.toggle("is-active", mode === "sentence-chunks" && index === grammarGuide.activeIndex);
        box.classList.toggle("is-revealed", revealed);
        box.setAttribute("role", "listitem");
        const label = document.createElement("div");
        label.className = "sentence-structure-part__label";
        const code = document.createElement("b");
        code.textContent = part.code;
        const role = document.createElement("small");
        role.textContent = part.role;
        label.append(code, role);
        const english = document.createElement("strong");
        english.textContent = part.text;
        const meaning = document.createElement("span");
        meaning.textContent = revealed ? grammarGuide.glosses[index] : "뜻을 골라보세요";
        box.append(label, english, meaning);
        ui.words.appendChild(box);
      });
      ui.words.dataset.mode = mode;
      return;
    }

    renderWordChoices(ui.words, stage, handler);
    ui.words.dataset.mode = mode;
    ui.words.querySelectorAll(".word-button").forEach((button) => {
      const token = String(button.dataset.token || "").toLowerCase();
      const punctuation = /^[.,!?]$/.test(token);
      if (verbFound && token === verb) button.classList.add("is-verb-found");
      if (prepositionFound && token === preposition) button.classList.add("is-preposition-found");
      if (keyWordFound && token === keyWord) button.classList.add("is-key-word-found");
      button.disabled = punctuation || !handler || (mode === "preposition" && token === verb);
    });
  }

  function renderWordChoices(container, stage, handler) {
    const tokens = stage.sentence.match(/[A-Za-z']+|[.,!?]/g) || [];
    tokens.forEach((token) => {
      const isPunctuation = /^[.,!?]$/.test(token);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "word-button";
      button.textContent = token;
      button.dataset.token = token;
      button.disabled = isPunctuation;
      if (handler) button.addEventListener("click", () => handler(button, token, stage));
      if (isPunctuation && container.lastElementChild) {
        const previous = container.lastElementChild;
        if (previous.classList.contains("word-punctuation-group")) {
          previous.appendChild(button);
        } else {
          const group = document.createElement("span");
          group.className = "word-punctuation-group";
          container.replaceChild(group, previous);
          group.append(previous, button);
        }
      } else {
        container.appendChild(button);
      }
    });
  }

  function chooseVerb(button, token, stage) {
    if (state.phase !== "mission") return;
    if (token.toLowerCase() === stage.verb.toLowerCase()) {
      button.classList.add("is-verb-found");
      ui.words.querySelectorAll(".word-button").forEach((item) => { item.disabled = true; });
      setMissionStatus("FOUND VERB", stage.verb, "뜻을 선택하세요.");
      ui.feedback.textContent = `맞아요! ‘${stage.verb}’가 문장을 움직이고 있어요.`;
      ui.feedback.classList.add("is-good");
      playSuccess();
      setTimeout(() => showVerbMeaning(stage), 720);
    } else {
      registerMistake(button, "동사가 아니에요. ‘무엇을 하다?’에 해당하는 단어를 찾아보세요.");
    }
  }

  function showVerbMeaning(stage) {
    ui.verbStep.classList.remove("is-active");
    ui.meaningStep.classList.add("is-active");
    renderMissionSentence(stage, "verb-meaning");
    setMissionStatus("FOUND VERB", stage.verb, "뜻을 선택하세요.");
    ui.mission.scrollTop = 0;
    ui.feedback.textContent = "";
    renderMeaningChoices(ui.answers, stage.verbOptions, (button, index) => chooseVerbMeaning(button, index, stage));
  }

  function renderMeaningChoices(container, options, handler) {
    const labels = ["A", "B", "C", "D"];
    options.forEach((answer, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer-button";
      button.innerHTML = `<b>${labels[index]}</b><span>${answer}</span>`;
      button.addEventListener("click", () => handler(button, index));
      container.appendChild(button);
    });
  }

  function chooseVerbMeaning(button, index, stage) {
    if (state.phase !== "mission") return;
    if (index === stage.verbCorrect) {
      button.classList.add("is-correct");
      ui.answers.querySelectorAll(".answer-button").forEach((item) => { item.disabled = true; });
      setMissionStatus("VERB", stage.verb, stage.verbMeaning, true);
      ui.mission.scrollTop = 0;
      ui.feedback.textContent = `정확해요! ‘${stage.verb}’는 ‘${stage.verbMeaning}’라는 뜻이에요.`;
      ui.feedback.classList.add("is-good");
      playSuccess();
      if (stage.preposition) setTimeout(() => showPreposition(stage), 760);
      else setTimeout(() => showSentenceMeaning(stage), 760);
    } else {
      registerMistake(button, "동사의 뜻을 다시 생각해보세요. 문장 속 주인공의 행동이 힌트예요.");
    }
  }

  function showPreposition(stage) {
    ui.meaningStep.classList.remove("is-active");
    ui.prepositionStep.classList.add("is-active");
    renderMissionSentence(stage, "preposition");
    setMissionStatus("STEP 03", stage.verb, `${stage.verbMeaning} · 전치사를 찾아보세요.`);
    ui.mission.scrollTop = 0;
    ui.feedback.textContent = "";
    ui.feedback.classList.remove("is-good");
  }

  function choosePreposition(button, token, stage) {
    if (state.phase !== "mission") return;
    if (token.toLowerCase() === stage.preposition.toLowerCase()) {
      button.classList.add("is-preposition-found");
      ui.words.querySelectorAll(".word-button").forEach((item) => { item.disabled = true; });
      setMissionStatus("FOUND PREPOSITION", stage.preposition, "뜻을 선택하세요.");
      ui.feedback.textContent = `맞아요! ‘${stage.preposition}’가 단어 사이의 관계를 연결해요.`;
      ui.feedback.classList.add("is-good");
      playSuccess();
      setTimeout(() => showPrepositionMeaning(stage), 720);
    } else {
      registerMistake(button, "전치사가 아니에요. 장소·시간·방향을 연결하는 짧은 단어를 찾아보세요.");
    }
  }

  function showPrepositionMeaning(stage) {
    ui.prepositionStep.classList.remove("is-active");
    ui.prepositionMeaningStep.classList.add("is-active");
    renderMissionSentence(stage, "preposition-meaning");
    setMissionStatus("FOUND PREPOSITION", stage.preposition, "뜻을 선택하세요.");
    ui.mission.scrollTop = 0;
    ui.feedback.textContent = "";
    renderMeaningChoices(ui.prepositionAnswers, stage.prepositionOptions, (button, index) => choosePrepositionMeaning(button, index, stage));
  }

  function choosePrepositionMeaning(button, index, stage) {
    if (state.phase !== "mission") return;
    if (index === stage.prepositionCorrect) {
      button.classList.add("is-correct");
      ui.prepositionAnswers.querySelectorAll(".answer-button").forEach((item) => { item.disabled = true; });
      setMissionStatus("PREPOSITION", stage.preposition, stage.prepositionMeaning, true);
      ui.mission.scrollTop = 0;
      ui.feedback.textContent = `좋아요! ‘${stage.preposition}’는 ‘${stage.prepositionMeaning}’라는 뜻이에요.`;
      ui.feedback.classList.add("is-good");
      playSuccess();
      setTimeout(() => showSentenceMeaning(stage), 760);
    } else {
      registerMistake(button, "조금 달라요. 전치사 뒤에 오는 말과의 관계를 다시 살펴보세요.");
    }
  }

  function showSentenceMeaning(stage) {
    ui.verbStep.classList.remove("is-active");
    ui.meaningStep.classList.remove("is-active");
    ui.prepositionStep.classList.remove("is-active");
    ui.prepositionMeaningStep.classList.remove("is-active");
    ui.sentenceMeaningStep.classList.add("is-active");
    const grammar = analyzeGrammar(stage);
    state.sentenceChunkQuiz = {
      parts: grammar.parts,
      glosses: getGrammarPartGlosses(stage, grammar.parts),
      revealed: grammar.parts.map(() => false),
      index: 0
    };
    ui.mission.scrollTop = 0;
    ui.feedback.textContent = "";
    ui.feedback.classList.remove("is-good");
    renderSentenceChunkQuestion(stage);
  }

  function renderSentenceChunkQuestion(stage) {
    const quiz = state.sentenceChunkQuiz;
    if (!quiz || !quiz.parts.length) return;
    const part = quiz.parts[quiz.index];
    const baseStep = stage.preposition ? "05" : "03";
    const answer = getSentenceChunkAnswer(stage, quiz, quiz.index);

    renderMissionSentence(stage, "sentence-chunks", {
      parts: quiz.parts,
      glosses: quiz.glosses,
      revealed: quiz.revealed,
      activeIndex: quiz.index
    });
    ui.sentenceStepNumber.textContent = `${baseStep}-${quiz.index + 1}`;
    ui.sentenceChunkPrompt.textContent = `${part.code}·${part.role} “${part.text}”의 뜻을 골라보세요.`;
    setMissionStatus(`CHUNK ${quiz.index + 1}/${quiz.parts.length}`, `${part.code} · ${part.role}`, part.text);
    ui.sentenceAnswers.replaceChildren();
    renderMeaningChoices(ui.sentenceAnswers, answer.options, (button, index) => chooseSentenceChunkMeaning(button, index, stage, answer));
    ui.mission.scrollTop = 0;
  }

  function getSentenceChunkAnswer(stage, quiz, chunkIndex) {
    const correct = quiz.glosses[chunkIndex];
    const distractors = [];
    [
      ...quiz.glosses.filter((_, index) => index !== chunkIndex),
      stage.verbMeaning,
      stage.prepositionMeaning,
      stage.keyWordMeaning,
      ...CHUNK_MEANING_DISTRACTORS
    ].forEach((value) => {
      const cleaned = String(value || "").trim();
      if (cleaned && cleaned !== correct && !distractors.includes(cleaned)) distractors.push(cleaned);
    });
    const base = [correct, ...distractors.slice(0, 3)];
    const rotation = (state.stage + chunkIndex) % base.length;
    const options = base.map((_, index) => base[(index + rotation) % base.length]);
    return { options, correct: options.indexOf(correct) };
  }

  function chooseSentenceChunkMeaning(button, index, stage, answer) {
    const quiz = state.sentenceChunkQuiz;
    if (state.phase !== "mission" || !quiz) return;
    if (index === answer.correct) {
      button.classList.add("is-correct");
      ui.sentenceAnswers.querySelectorAll(".answer-button").forEach((item) => { item.disabled = true; });
      quiz.revealed[quiz.index] = true;
      renderMissionSentence(stage, "sentence-chunks", {
        parts: quiz.parts,
        glosses: quiz.glosses,
        revealed: quiz.revealed,
        activeIndex: quiz.index
      });
      ui.feedback.textContent = `정확해요! ‘${quiz.parts[quiz.index].text}’는 ‘${quiz.glosses[quiz.index]}’라는 뜻이에요.`;
      ui.feedback.classList.add("is-good");
      ui.mission.scrollTop = 0;
      playSuccess();
      setTimeout(() => {
        if (quiz.index < quiz.parts.length - 1) {
          quiz.index += 1;
          ui.feedback.textContent = "";
          ui.feedback.classList.remove("is-good");
          renderSentenceChunkQuestion(stage);
        } else {
          completeSentenceChunkQuiz(stage, quiz);
        }
      }, 680);
    } else {
      registerMistake(button, "위에서 빛나는 문장 성분을 보고 그 부분의 뜻을 다시 골라보세요.");
    }
  }

  function completeSentenceChunkQuiz(stage, quiz) {
    const baseStep = stage.preposition ? "05" : "03";
    renderMissionSentence(stage, "sentence-chunks", {
      parts: quiz.parts,
      glosses: quiz.glosses,
      revealed: quiz.parts.map(() => true),
      activeIndex: -1
    });
    ui.sentenceStepNumber.textContent = baseStep;
    ui.sentenceChunkPrompt.textContent = "끊어 읽기를 모두 완료했어요. 완성된 문장을 읽어보세요.";
    ui.sentenceAnswers.replaceChildren();
    ui.sentenceTranslationText.textContent = stage.sentenceMeaning;
    ui.sentenceTranslation.classList.remove("is-pending");
    ui.sentenceTranslation.classList.add("is-visible");
    setMissionStatus("TRANSLATION", "COMPLETE", "모든 문장 성분의 뜻을 맞혔어요.", true);
    ui.feedback.textContent = "문장 성분을 모두 연결해 전체 해석을 완성했어요!";
    ui.feedback.classList.add("is-good");
    ui.mission.scrollTop = 0;
    setTimeout(() => showGrammarExplanation(stage), 900);
  }

  function analyzeGrammar(stage) {
    const tokens = stage.sentence.match(/[A-Za-z']+/g) || [];
    const lower = tokens.map((token) => token.toLowerCase());
    const verb = String(stage.verb || "").toLowerCase();
    let verbIndex = lower.indexOf(verb);
    if (verbIndex < 0) verbIndex = Math.min(1, Math.max(0, tokens.length - 1));
    const subject = tokens.slice(0, verbIndex).join(" ") || tokens[0] || "주어";
    const verbText = tokens[verbIndex] || stage.verb || "동사";
    const sentenceEndsWithQuestion = /\?\s*$/.test(stage.sentence);
    const modifierIndex = (() => {
      const selectedPreposition = String(stage.preposition || "").toLowerCase();
      if (selectedPreposition) {
        const index = lower.indexOf(selectedPreposition, verbIndex + 1);
        if (index >= 0) return index;
      }
      return lower.findIndex((token, index) => index > verbIndex && COMMON_PREPOSITIONS.has(token));
    })();
    const modifierText = modifierIndex >= 0 ? tokens.slice(modifierIndex).join(" ") : "";
    const baseParts = [
      { code: "S", role: "주어", text: subject },
      { code: "V", role: "동사", text: verbText }
    ];
    let pattern = "S + V";
    let parts = baseParts.slice();
    let explanation = "주어와 동사를 먼저 찾으면 문장의 중심 뜻이 보여요.";
    let translationTip = "먼저 ‘누가 무엇을 하는지’를 해석한 뒤, 뒤의 설명을 차례대로 붙이세요.";

    if (sentenceEndsWithQuestion && QUESTION_AUXILIARIES.has(lower[0])) {
      pattern = "조동사·be동사 + S + V ... ?";
      parts = [
        { code: "Q", role: "의문문 시작", text: tokens[0] },
        { code: "CORE", role: "질문의 중심 내용", text: tokens.slice(1).join(" ") }
      ];
      explanation = "평서문과 달리 조동사나 be동사가 주어 앞으로 이동한 의문문 어순이에요.";
      translationTip = "앞의 조동사는 질문 표시로 보고, 뒤의 주어와 동사부터 평서문처럼 묶어 해석하세요.";
    } else if (lower[0] === "there" && BE_VERBS.has(lower[1])) {
      pattern = "There + be동사 + 명사";
      parts = [
        { code: "THERE", role: "존재를 여는 말", text: tokens[0] },
        { code: "V", role: "be동사", text: tokens[1] },
        { code: "S", role: "실제 주어", text: tokens.slice(2, modifierIndex >= 0 ? modifierIndex : tokens.length).join(" ") }
      ];
      if (modifierText) parts.push({ code: "M", role: "장소·시간 설명", text: modifierText });
      explanation = "There is/are는 평소와 달리 실제 주어가 be동사 뒤에 오는 존재 문장이에요.";
      translationTip = "뒤의 명사를 먼저 찾고 ‘~가 있다’라고 해석한 다음 장소나 시간을 붙이세요.";
    } else {
      const thatIndex = lower.indexOf("that", verbIndex + 1);
      const toIndex = lower.indexOf("to", verbIndex + 1);
      const clauseMarkers = { because: "이유", when: "시간", if: "조건", although: "양보", while: "시간·대조" };
      const clauseIndex = lower.findIndex((token, index) => index > verbIndex && clauseMarkers[token]);
      const nextWord = lower[verbIndex + 1] || "";
      const passive = BE_VERBS.has(verb) && /(?:ed|en|wn|nt)$/.test(nextWord);

      if (thatIndex >= 0) {
        pattern = "S + V + that절(O)";
        parts.push({ code: "O", role: "목적어 역할의 that절", text: tokens.slice(thatIndex).join(" ") });
        explanation = "주어와 동사 뒤의 that절 전체가 목적어 역할을 하는 문장 구조예요. that 뒤에는 다시 주어와 동사가 있는 완전한 문장이 와요.";
        translationTip = "먼저 앞의 ‘주어가 생각한다·말한다’를 해석하고, that 뒤 문장을 ‘~라고·~라는 것을’로 한 덩어리처럼 붙이세요.";
      } else if (toIndex > verbIndex && TO_INFINITIVE_HEADS.has(verb) && (toIndex === verbIndex + 1 || toIndex === verbIndex + 2)) {
        const objectBeforeTo = tokens.slice(verbIndex + 1, toIndex).join(" ");
        if (objectBeforeTo) parts.push({ code: "O", role: "목적어", text: objectBeforeTo });
        parts.push({ code: "TO", role: "to부정사", text: tokens.slice(toIndex, modifierIndex > toIndex ? modifierIndex : tokens.length).join(" ") });
        if (modifierIndex > toIndex) parts.push({ code: "M", role: "추가 설명", text: modifierText });
        pattern = objectBeforeTo ? "S + V + O + to부정사" : "S + V + to부정사";
        explanation = "to 뒤의 동사원형이 ‘~하는 것’ 또는 ‘~하기 위해’라는 의미 덩어리를 만드는 문장 구조예요.";
        translationTip = "주어와 동사를 먼저 해석하고, to부터 이어지는 부분을 ‘~하는 것·~하기 위해’로 묶으세요.";
      } else if (clauseIndex >= 0) {
        const objectText = tokens.slice(verbIndex + 1, clauseIndex).join(" ");
        if (objectText) parts.push({ code: "O", role: "동사 뒤 내용", text: objectText });
        parts.push({ code: "SUB", role: `${clauseMarkers[lower[clauseIndex]]}을 나타내는 절`, text: tokens.slice(clauseIndex).join(" ") });
        pattern = `주절 + ${lower[clauseIndex]}절`;
        explanation = `${tokens[clauseIndex]} 뒤의 주어와 동사가 ${clauseMarkers[lower[clauseIndex]]}을 설명하는 종속절을 만들어요.`;
        translationTip = "접속사 앞의 중심 문장을 먼저 해석하고, 접속사 뒤 문장을 이유·시간·조건 설명으로 붙이세요.";
      } else if (passive) {
        const predicateEnd = modifierIndex >= 0 ? modifierIndex : Math.min(tokens.length, verbIndex + 2);
        pattern = "S + be동사 + p.p. (수동태)";
        parts = [
          { code: "S", role: "행동을 받는 주어", text: subject },
          { code: "V", role: "be동사 + 과거분사", text: tokens.slice(verbIndex, predicateEnd).join(" ") }
        ];
        if (modifierText) parts.push({ code: "M", role: "행동 주체·추가 설명", text: modifierText });
        explanation = "be동사와 과거분사가 함께 쓰여 주어가 행동을 ‘하는’ 것이 아니라 행동을 ‘받는’ 수동태예요.";
        translationTip = "주어를 먼저 놓고 ‘~되다·~받다’로 해석한 뒤, by가 있으면 행동한 대상을 붙이세요.";
      } else if (BE_VERBS.has(verb)) {
        const complement = tokens.slice(verbIndex + 1, modifierIndex >= 0 ? modifierIndex : tokens.length).join(" ");
        pattern = modifierText ? "S + V + C + M" : "S + V + C";
        if (complement) parts.push({ code: "C", role: "주어를 설명하는 보어", text: complement });
        if (modifierText) parts.push({ code: "M", role: "장소·시간 설명", text: modifierText });
        explanation = "be동사 뒤의 보어가 주어의 상태나 정체를 설명하는 문장 구조예요.";
        translationTip = "주어와 be동사를 ‘~은/는 ~이다·있다’로 묶고, 장소나 시간 표현을 마지막에 붙이세요.";
      } else {
        const objectEnd = modifierIndex >= 0 ? modifierIndex : tokens.length;
        const particleIndex = lower.findIndex((token, index) => index > verbIndex && index < objectEnd && ["back", "up", "out", "away"].includes(token));
        const objectTokens = tokens.slice(verbIndex + 1, particleIndex >= 0 ? particleIndex : objectEnd);
        if (objectTokens.length) parts.push({ code: "O", role: "목적어", text: objectTokens.join(" ") });
        if (particleIndex >= 0) parts.push({ code: "P", role: "동사의 의미를 완성하는 말", text: tokens[particleIndex] });
        if (modifierText) parts.push({ code: "M", role: "장소·시간·방법 설명", text: modifierText });
        pattern = `S + V${objectTokens.length ? " + O" : ""}${particleIndex >= 0 ? " + P" : ""}${modifierText ? " + M" : ""}`;
        explanation = objectTokens.length
          ? "주어가 목적어에 어떤 행동을 하는 구조이며, 뒤의 수식어는 시간·장소·방법을 덧붙여요."
          : "주어와 동사가 중심을 이루고, 뒤의 수식어가 시간·장소·방법을 덧붙여요.";
        translationTip = objectTokens.length
          ? "먼저 ‘주어가 목적어를 동사한다’라는 뼈대를 해석하고, 전치사구나 부사 표현을 마지막에 붙이세요."
          : "주어와 동사를 먼저 묶은 뒤, 전치사구나 부사 표현을 뒤에서부터 자연스럽게 붙이세요.";
      }
    }

    const lowerSentence = ` ${stage.sentence.toLowerCase().replace(/[^a-z']+/g, " ").trim()} `;
    const expressions = GRAMMAR_EXPRESSIONS
      .filter((item) => lowerSentence.includes(` ${item.phrase} `))
      .map((item) => item.meaning);
    if (/\bbring\b[\s\S]*\bback\b/i.test(stage.sentence)) {
      expressions.unshift("bring A back은 ‘A를 되찾아오다·다시 가져오다’라는 표현이에요.");
    }
    if (!expressions.length && modifierText) {
      expressions.push(`‘${modifierText}’는 문장에 장소·시간·방법을 덧붙이는 전치사구예요.`);
    }
    if (!expressions.length) expressions.push("특별한 숙어는 없어요. 주어와 동사를 중심으로 차근차근 해석하면 됩니다.");

    return { pattern, parts, explanation, translationTip, expression: expressions.slice(0, 2).join(" ") };
  }

  function showGrammarExplanation(stage) {
    const grammar = analyzeGrammar(stage);
    const glosses = getGrammarPartGlosses(stage, grammar.parts);
    ui.sentenceMeaningStep.classList.remove("is-active");
    ui.grammarStep.classList.add("is-active");
    ui.mission.classList.add("is-grammar");
    renderMissionSentence(stage, "grammar", { parts: grammar.parts, glosses });
    setMissionStatus("SENTENCE MAP", grammar.pattern, "문장의 구조와 각 부분의 뜻을 확인하세요.");
    ui.mission.scrollTop = 0;
    ui.grammarExpression.textContent = grammar.expression;
    ui.grammarNext.disabled = false;
    ui.feedback.textContent = "";
    ui.feedback.classList.remove("is-good");
  }

  function getGrammarPartGlosses(stage, parts) {
    const supplied = Array.isArray(stage.grammarGlosses) ? stage.grammarGlosses : [];
    return parts.map((part, index) => {
      const suppliedGloss = String(supplied[index] || "").trim();
      if (suppliedGloss) return suppliedGloss;
      if (part.code === "V") return String(stage.verbMeaning || "동작을 나타내는 말");
      if (part.code === "M" && stage.prepositionMeaning) return String(stage.prepositionMeaning).replace(/^~/, "");
      if (part.code === "P") return "동사의 뜻을 완성하는 말";
      if (part.code === "S") return "누가? — 문장의 주인공";
      if (part.code === "O") return "무엇을? — 동작의 대상";
      if (part.code === "C") return "주어의 상태·모습";
      if (part.code === "TO") return "~하는 것 · ~하기 위해";
      if (part.code === "SUB") return "이유·시간·조건을 덧붙이는 절";
      return part.role;
    });
  }

  function acknowledgeGrammar() {
    if (state.phase !== "mission" || !ui.grammarStep.classList.contains("is-active")) return;
    ui.grammarNext.disabled = true;
    playTone(380, .09, "sine", .04);
    showKeyWordMeaning(story[state.stage]);
  }

  function getKeyWordQuiz(stage) {
    const word = String(stage.keyWord || stage.verb || "word");
    const meaning = String(stage.keyWordMeaning || stage.verbMeaning || "뜻을 확인해보세요");
    const provided = Array.isArray(stage.keyWordOptions) ? stage.keyWordOptions.map((item) => String(item).trim()).filter(Boolean) : [];
    const unique = [];
    [meaning, ...provided, ...KEY_WORD_DISTRACTORS].forEach((item) => {
      if (item && !unique.includes(item)) unique.push(item);
    });
    const options = provided.length === 4 && provided.includes(meaning) ? provided : unique.slice(0, 4);
    const suppliedCorrect = Number.isInteger(stage.keyWordCorrect) ? stage.keyWordCorrect : -1;
    const correct = suppliedCorrect >= 0 && suppliedCorrect < options.length && options[suppliedCorrect] === meaning
      ? suppliedCorrect
      : options.indexOf(meaning);
    return { word, meaning, options, correct };
  }

  function showKeyWordMeaning(stage) {
    const quiz = getKeyWordQuiz(stage);
    ui.sentenceMeaningStep.classList.remove("is-active");
    ui.grammarStep.classList.remove("is-active");
    ui.mission.classList.remove("is-grammar");
    ui.keyWordStep.classList.add("is-active");
    renderMissionSentence(stage, "key-word");
    setMissionStatus("KEY WORD", quiz.word, "뜻을 선택하세요.");
    ui.mission.scrollTop = 0;
    ui.feedback.textContent = "";
    ui.feedback.classList.remove("is-good");
    renderMeaningChoices(ui.keyWordAnswers, quiz.options, (button, index) => chooseKeyWordMeaning(button, index, stage, quiz));
  }

  function chooseKeyWordMeaning(button, index, stage, quiz) {
    if (state.phase !== "mission") return;
    if (index === quiz.correct) {
      button.classList.add("is-correct");
      ui.keyWordAnswers.querySelectorAll(".answer-button").forEach((item) => { item.disabled = true; });
      setMissionStatus("KEY WORD", quiz.word, quiz.meaning, true);
      ui.mission.scrollTop = 0;
      ui.feedback.textContent = `훌륭해요! 중요한 단어 ‘${quiz.word}’는 ‘${quiz.meaning}’라는 뜻이에요.`;
      ui.feedback.classList.add("is-good");
      playSuccess();
      setTimeout(() => completeStage(stage), 760);
    } else {
      registerMistake(button, "문장 전체의 뜻을 떠올리며 중요한 단어의 의미를 다시 골라보세요.");
    }
  }

  function registerMistake(button, message) {
    state.mistakes += 1;
    state.stageMistakes += 1;
    button.classList.add("is-wrong");
    button.disabled = true;
    ui.feedback.textContent = message;
    ui.feedback.classList.remove("is-good");
    ui.mission.classList.remove("is-shaking");
    void ui.mission.offsetWidth;
    ui.mission.classList.add("is-shaking");
    updateFocus();
    playTone(145, .13, "sawtooth", .035);
  }

  function updateFocus() {
    const left = Math.max(1, 3 - state.stageMistakes);
    $$(".focus-dot").forEach((dot, index) => dot.classList.toggle("is-on", index < left));
  }

  function setTravelGuide(isTraveling) {
    ui.game.dataset.moving = isTraveling ? "true" : "false";
    ui.guideIcon.textContent = isTraveling ? "W" : "Ⅱ";
    ui.guideTitle.textContent = isTraveling ? "다음 장소로 이동 중" : "미션 앞에서 멈춤";
    ui.guideText.textContent = isTraveling ? "길이 열렸어요" : "정답을 맞히면 다시 출발해요";
  }

  function completeStage(stage) {
    state.phase = "transition";
    state.peace += 1;
    state.travelSpeed = 1.35;
    setTravelGuide(true);
    ui.peace.textContent = state.peace;
    ui.progress.style.width = `${(state.peace / story.length) * 100}%`;
    ui.transitionTitle.textContent = state.stage === story.length - 1 ? "평화의 길이 완성되었습니다" : "길이 다시 움직입니다";
    ui.transitionCopy.textContent = stage.transition;
    playSuccess(true);
    ui.flash.classList.remove("is-active");
    void ui.flash.offsetWidth;
    ui.flash.classList.add("is-active");
    setTimeout(() => {
      ui.mission.classList.remove("is-visible");
      ui.speech.classList.remove("is-visible");
      ui.transition.classList.add("is-visible");
    }, 650);

    state.transitionTimer = setTimeout(() => {
      ui.transition.classList.remove("is-visible");
      if (state.stage >= story.length - 1) showEnding();
      else startStage(state.stage + 1);
    }, 3550);
  }

  function updateHud() {
    const stage = story[state.stage];
    ui.location.textContent = stage.location;
    ui.chapter.textContent = stage.chapter;
    ui.count.textContent = `${state.stage + 1} / ${story.length}`;
    ui.progress.style.width = `${(state.peace / story.length) * 100}%`;
  }

  function showEnding() {
    state.phase = "ending";
    state.travelSpeed = .22;
    phone.visible = true;
    ui.hud.classList.remove("is-visible");
    ui.guide.classList.remove("is-visible");
    ui.endingPeace.textContent = `${story.length} / ${story.length}`;
    ui.endingWords.textContent = String(story.length * 2 + story.filter((stage) => stage.preposition).length);
    ui.endingScore.textContent = `${Math.max(55, Math.round(100 - state.mistakes * 4.5))}%`;
    if (state.customMode) {
      ui.endingStory.textContent = "사진에서 찾은 숙제 문장들이 하나의 모험이 되었습니다. 오늘의 본문을 끝까지 모두 해독했어요.";
      ui.endingLessonLabel.textContent = "오늘 완성한 숙제 탐험";
      ui.endingLessonText.textContent = `${story.length}개의 본문 문장을 직접 읽고 해결했습니다.`;
    } else {
      ui.endingStory.innerHTML = "스마트폰은 사랑과 평화를 빼앗은 악당처럼 보였지만,<br>길을 잃었을 때 빛을 비춰 준 친구이기도 했습니다.";
      ui.endingLessonLabel.textContent = "루가 찾은 마지막 문장";
      ui.endingLessonText.innerHTML = "“내가 스마트폰을 사용하는 것이지,<br>스마트폰이 나를 사용하는 게 아니야.”";
    }
    ui.ending.classList.add("is-visible");
    playEndingChord();
  }

  function restart() {
    clearTimeout(state.transitionTimer);
    state.stage = 0;
    state.peace = 0;
    state.mistakes = 0;
    state.stageMistakes = 0;
    state.phase = "mission";
    state.travelSpeed = 0;
    state.lateral = 0;
    state.lateralTarget = 0;
    ui.peace.textContent = "0";
    ui.ending.classList.remove("is-visible");
    ui.hud.classList.add("is-visible");
    ui.guide.classList.add("is-visible");
    startStage(0);
  }

  function toggleCamera() {
    state.cameraClose = !state.cameraClose;
    showToast(state.cameraClose ? "몰입 카메라로 전환했어요" : "넓은 추적 카메라로 전환했어요");
    playTone(360, .08, "sine", .035);
  }

  function toggleSound() {
    state.sound = !state.sound;
    $$("#sound-button, #title-sound").forEach((button) => { button.textContent = state.sound ? "♫" : "×"; });
    if (state.sound) {
      initAudio();
      playTone(440, .08, "sine", .035);
    } else {
      clearTimeout(sentenceSpeechTimer);
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    }
    showToast(state.sound ? "소리를 켰어요" : "소리를 껐어요");
  }

  function speakMissionSentence(sentence) {
    clearTimeout(sentenceSpeechTimer);
    if (!state.sound || !("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance !== "function") return;

    const text = String(sentence || "").trim();
    if (!text) return;
    const stageIndex = state.stage;
    let voiceLoadAttempts = 0;

    const speakWhenReady = () => {
      if (!state.sound || state.phase !== "mission" || state.stage !== stageIndex) return;

      const voices = window.speechSynthesis.getVoices();
      if (!voices.length && voiceLoadAttempts < 6) {
        voiceLoadAttempts += 1;
        sentenceSpeechTimer = setTimeout(speakWhenReady, 180);
        return;
      }

      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = .9;
      utterance.pitch = 1;
      utterance.volume = .95;

      const englishVoices = voices.filter((voice) => voice.lang && voice.lang.toLowerCase().startsWith("en"));
      let englishVoice = null;
      NATURAL_ENGLISH_VOICE_NAMES.some((namePattern) => {
        englishVoice = englishVoices.find((voice) => namePattern.test(voice.name));
        return Boolean(englishVoice);
      });
      englishVoice = englishVoice
        || englishVoices.find((voice) => voice.lang === "en-US" && !NOVELTY_VOICE_NAMES.test(voice.name))
        || englishVoices.find((voice) => !NOVELTY_VOICE_NAMES.test(voice.name));
      if (englishVoice) utterance.voice = englishVoice;

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    };

    sentenceSpeechTimer = setTimeout(speakWhenReady, 260);
  }

  function showToast(message, good) {
    ui.toast.textContent = message;
    ui.toast.classList.toggle("is-good", Boolean(good));
    ui.toast.classList.add("is-visible");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => ui.toast.classList.remove("is-visible"), 1800);
  }

  function initAudio() {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") audioContext.resume();
  }

  function playTone(frequency, duration, type, volume) {
    if (!state.sound) return;
    initAudio();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type || "sine";
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gain.gain.setValueAtTime(0, audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(volume || .04, audioContext.currentTime + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration + .03);
  }

  function playSuccess(big) {
    playTone(440, .14, "sine", .045);
    setTimeout(() => playTone(554, .15, "sine", .04), 90);
    setTimeout(() => playTone(big ? 880 : 659, .24, "sine", .038), 180);
  }

  function playEndingChord() {
    [261, 329, 392, 523].forEach((note, index) => setTimeout(() => playTone(note, .8, "sine", .026), index * 150));
  }

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), .04);
    const elapsed = clock.elapsedTime;
    updateTravel(dt, elapsed);
    updateHero(dt, elapsed);
    updateCamera(dt, elapsed);
    updatePhone(elapsed);
    renderer.render(scene, camera);
  }

  function updateTravel(dt, elapsed) {
    const speed = state.phase === "title" ? .15 : state.travelSpeed;
    const move = dt * speed * 7.5;
    pathSegments.forEach((segment) => {
      segment.position.z += move;
      if (segment.position.z > 10) segment.position.z -= 204;
      segment.position.x = pathX(segment.position.z);
    });
    props.forEach((prop, index) => {
      prop.position.z += move;
      if (prop.position.z > 13) {
        prop.position.z -= 196;
        prop.position.x = pathX(prop.position.z) + prop.userData.side * (5.5 + (index % 6) * 1.5);
      }
      if (prop.userData.spin) {
        prop.rotation.y += dt * .3;
        prop.position.y += Math.sin(elapsed * 1.2 + index) * .0015;
      }
    });
    particles.position.z += move * .25;
    if (particles.position.z > 25) particles.position.z = 0;
  }

  function updateHero(dt, elapsed) {
    state.lateral += (state.lateralTarget - state.lateral) * Math.min(1, dt * 6);
    const homeX = state.phase === "title" ? 3.2 : state.lateral;
    hero.position.x += (homeX - hero.position.x) * Math.min(1, dt * 7);

    if (state.jumping) {
      hero.position.y += state.jumpVelocity * dt;
      state.jumpVelocity -= 12 * dt;
      if (hero.position.y <= 0) {
        hero.position.y = 0;
        state.jumping = false;
      }
    }

    const walking = state.phase === "title" || state.travelSpeed > .05;
    const stride = Math.sin(elapsed * (state.travelSpeed > 1 ? 11 : 7.5)) * (walking ? .56 : 0);
    const leftArm = hero.getObjectByName("leftArm");
    const rightArm = hero.getObjectByName("rightArm");
    const leftLeg = hero.getObjectByName("leftLeg");
    const rightLeg = hero.getObjectByName("rightLeg");
    if (leftArm) leftArm.rotation.x = stride * .68;
    if (rightArm) rightArm.rotation.x = -stride * .68;
    if (leftLeg) leftLeg.rotation.x = -stride;
    if (rightLeg) rightLeg.rotation.x = stride;
    const scarf = hero.getObjectByName("scarf");
    if (scarf) scarf.rotation.x = .12 + (walking ? Math.sin(elapsed * 5) * .08 : 0);
    if (!state.jumping) {
      const targetY = walking ? Math.abs(Math.sin(elapsed * 7.5)) * .035 : 0;
      hero.position.y += (targetY - hero.position.y) * Math.min(1, dt * 14);
    }
    const targetTilt = walking ? (state.lateralTarget - state.lateral) * -.035 : 0;
    hero.rotation.z += (targetTilt - hero.rotation.z) * Math.min(1, dt * 12);
  }

  function updateCamera(dt, elapsed) {
    const close = state.cameraClose;
    const targetX = state.phase === "title" ? 0 : hero.position.x * .42;
    const desiredY = close ? 3.55 : 4.35;
    const desiredZ = close ? 7.3 : 11.8;
    camera.position.x += (targetX - camera.position.x) * Math.min(1, dt * 3.5);
    camera.position.y += (desiredY - camera.position.y) * Math.min(1, dt * 3.5);
    camera.position.z += (desiredZ - camera.position.z) * Math.min(1, dt * 3.5);
    const bob = state.travelSpeed > .05 ? Math.sin(elapsed * 7.5) * .018 : 0;
    camera.lookAt(hero.position.x * .22, 1.6 + bob, close ? -2.7 : -4.1);
  }

  function updatePhone(elapsed) {
    if (!phone.visible) return;
    const targetX = hero.position.x + 1.45;
    phone.position.x += (targetX - phone.position.x) * .08;
    phone.position.y = 2.35 + Math.sin(elapsed * 2.1) * .22;
    phone.position.z = .35 + Math.cos(elapsed * 1.4) * .12;
    phone.rotation.y = Math.sin(elapsed * 1.1) * .16;
    phone.rotation.z = Math.sin(elapsed * 1.6) * .06;
  }

  function onResize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  }
})();
