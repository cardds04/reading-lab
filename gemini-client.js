(() => {
  "use strict";

  const MODEL = "gemini-3.5-flash";

  const wordSchema = {
    type: "OBJECT",
    properties: { word: { type: "STRING" }, meaning: { type: "STRING" } },
    required: ["word", "meaning"]
  };

  const sentenceItem = {
    type: "OBJECT",
    properties: {
      sentence: { type: "STRING" }, translation: { type: "STRING" }, verb: { type: "STRING" },
      verbs: { type: "ARRAY", items: { type: "STRING" } }, verbMeaning: { type: "STRING" },
      preposition: { type: "STRING" }, prepositionMeaning: { type: "STRING" },
      sentenceOptions: { type: "ARRAY", items: { type: "STRING" } }, sentenceCorrect: { type: "INTEGER" },
      wordGlosses: { type: "ARRAY", items: { type: "OBJECT", properties: { word: { type: "STRING" }, meaning: { type: "STRING" } }, required: ["word", "meaning"] } },
      idioms: { type: "ARRAY", items: { type: "OBJECT", properties: { phrase: { type: "STRING" }, meaning: { type: "STRING" } }, required: ["phrase", "meaning"] } },
      chunks: { type: "ARRAY", items: { type: "OBJECT", properties: { text: { type: "STRING" }, meaning: { type: "STRING" }, role: { type: "STRING" }, options: { type: "ARRAY", items: { type: "STRING" } }, correctIndex: { type: "INTEGER" } }, required: ["text", "meaning", "role", "options", "correctIndex"] } },
      grammarPattern: { type: "STRING" }, grammarExplanation: { type: "STRING" }
    },
    required: ["sentence", "translation", "verb", "verbs", "verbMeaning", "preposition", "prepositionMeaning", "sentenceOptions", "sentenceCorrect", "wordGlosses", "idioms", "chunks", "grammarPattern", "grammarExplanation"]
  };
  const bodySchema = { type: "OBJECT", properties: { sentences: { type: "ARRAY", items: sentenceItem } }, required: ["sentences"] };
  const titleSchema = { type: "OBJECT", properties: { title: { type: "STRING" } }, required: ["title"] };

  const analysisPrompt = `Extract complete English passage sentences in printed order. Ignore headers, page numbers, copyright, exercises and captions. For every sentence return a natural Korean translation; the main verb and all finite clause verbs; one preposition or empty strings; 2-5 contiguous meaningful reading chunks with natural Korean meaning, role, four choices and correctIndex; four complete-sentence Korean choices; every unique word with its short contextual Korean meaning; every idiom, phrasal verb or fixed expression with a short Korean meaning; and a concise grammar pattern and Korean explanation. If a comma joins two clauses include both finite verbs, but do not count an infinitive after to. Preserve exact English text and do not invent missing text.`;

  window.geminiAnalyze = async function geminiAnalyze(payload) {
    const apiKey = String(payload.apiKey || "").trim();
    if (!apiKey) throw new Error("Gemini API 키를 입력해주세요.");
    const mode = String(payload.mode || "");
    let prompt = analysisPrompt;
    let schema = bodySchema;
    const parts = [];
    if (mode === "cover") {
      prompt = "Return only the main English children's book title. Exclude author, publisher, series labels and reading level.";
      schema = titleSchema;
    } else if (mode === "word") {
      prompt = `English sentence: ${payload.sentence}\nTarget word or phrase: ${payload.word}\nReturn one short natural Korean meaning fitting this context.`;
      schema = wordSchema;
    } else if (mode === "sentence") {
      prompt += ` Analyze exactly this supplied sentence and return exactly one item: ${payload.sentence}`;
    }
    parts.push({ text: prompt });
    for (const image of (payload.images || []).slice(0, 1)) parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
    let response;
    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { temperature: 0.1, responseMimeType: "application/json", responseSchema: schema } })
      });
    } catch (_) {
      throw new Error("Gemini에 연결하지 못했어요. 인터넷 연결을 확인해주세요.");
    }
    const result = await response.json();
    if (!response.ok) throw new Error(result?.error?.message || "Gemini 요청에 실패했습니다.");
    const text = (result.candidates?.[0]?.content?.parts || []).map(part => part.text || "").join("").replace(/^```(?:json)?\s*|\s*```$/gi, "");
    return JSON.parse(text);
  };
})();
