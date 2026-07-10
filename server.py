#!/usr/bin/env python3
"""Static development server with a private Gemini image-analysis proxy."""

from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote


ROOT = Path(__file__).resolve().parent
HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "4173"))
MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.5-flash")
MAX_REQUEST_BYTES = 28 * 1024 * 1024


TITLE_SCHEMA = {
    "type": "OBJECT",
    "properties": {"title": {"type": "STRING"}},
    "required": ["title"],
}

WORD_SCHEMA = {
    "type": "OBJECT",
    "properties": {"word": {"type": "STRING"}, "meaning": {"type": "STRING"}},
    "required": ["word", "meaning"],
}

BODY_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "sentences": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "sentence": {"type": "STRING"},
                    "translation": {"type": "STRING"},
                    "verb": {"type": "STRING"},
                    "verbs": {"type": "ARRAY", "items": {"type": "STRING"}},
                    "verbMeaning": {"type": "STRING"},
                    "preposition": {"type": "STRING"},
                    "prepositionMeaning": {"type": "STRING"},
                    "sentenceOptions": {"type": "ARRAY", "items": {"type": "STRING"}},
                    "sentenceCorrect": {"type": "INTEGER"},
                    "wordGlosses": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {"word": {"type": "STRING"}, "meaning": {"type": "STRING"}},
                            "required": ["word", "meaning"],
                        },
                    },
                    "idioms": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {"phrase": {"type": "STRING"}, "meaning": {"type": "STRING"}},
                            "required": ["phrase", "meaning"],
                        },
                    },
                    "chunks": {
                        "type": "ARRAY",
                        "items": {
                            "type": "OBJECT",
                            "properties": {
                                "text": {"type": "STRING"},
                                "meaning": {"type": "STRING"},
                                "role": {"type": "STRING"},
                                "options": {"type": "ARRAY", "items": {"type": "STRING"}},
                                "correctIndex": {"type": "INTEGER"},
                            },
                            "required": ["text", "meaning", "role", "options", "correctIndex"],
                        },
                    },
                    "grammarPattern": {"type": "STRING"},
                    "grammarExplanation": {"type": "STRING"},
                },
                "required": [
                    "sentence",
                    "translation",
                    "verb",
                    "verbs",
                    "verbMeaning",
                    "preposition",
                    "prepositionMeaning",
                    "sentenceOptions",
                    "sentenceCorrect",
                    "wordGlosses",
                    "idioms",
                    "chunks",
                    "grammarPattern",
                    "grammarExplanation",
                ],
            },
        }
    },
    "required": ["sentences"],
}


def prompt_for(mode: str) -> str:
    if mode == "cover":
        return (
            "You are reading the cover of an English children's book. "
            "Return only the main book title exactly as printed. Exclude author, illustrator, "
            "publisher, series labels, reading level, badges, and promotional text."
        )
    return (
        "Read this photographed English book page carefully. Extract only complete English "
        "sentences from the main story or reading passage, in printed order. Ignore page numbers, "
        "headers, footers, publisher text, copyright, vocabulary labels, exercises, and captions "
        "that are not part of the passage. Preserve spelling, capitalization, contractions, and "
        "punctuation. For every sentence: provide a natural Korean translation; identify the main "
        "lexical verb exactly as it appears in the sentence and its Korean meaning. In verbs, list every "
        "verb word that a student should find, in printed order. If a comma joins two clauses with two "
        "verbs, include both finite clause verbs. Include the main finite verb of each clause, but do not "
        "include an infinitive after 'to' such as 'grow' in 'starts to grow'. Do not include a mere auxiliary "
        "when its lexical verb is also present. Also identify one "
        "preposition exactly as it appears and its Korean meaning. If there is no preposition, use "
        "an empty string for both preposition fields. Then proofread the sentence in its full context "
        "and divide it into 2 to 5 contiguous, meaningful reading chunks based on syntax and meaning, "
        "not equal word counts. Keep a determiner with its noun, an adjective with its noun, a "
        "preposition with its object, and a multiword verb together. For a time/reason/condition clause, "
        "make the Korean meaning complete and contextual: for example 'When a baby chicken starts to "
        "grow' must mean '아기 병아리가 자라기 시작할 때', never '아기 병아리가 불과합니다'. "
        "Every English word must belong to exactly one chunk in original order. For each chunk provide "
        "a natural Korean meaning, a short Korean role label, and exactly four distinct Korean answer "
        "choices with the correct meaning included; correctIndex is its zero-based position. Also make exactly "
        "four distinct Korean choices for the meaning of the complete sentence in sentenceOptions, with the "
        "natural full translation included, and put its zero-based position in sentenceCorrect. The wrong choices "
        "must be plausible but contextually or grammatically incorrect. In wordGlosses, include every "
        "unique English word from the sentence with its short Korean meaning in this context. In idioms, "
        "list every multiword idiom, phrasal verb, or fixed expression in the sentence with one short Korean "
        "meaning; use an empty array when there is none. Also provide "
        "a concise grammar pattern and a Korean explanation tailored to this sentence. Do not invent "
        "missing text."
    )


def gemini_request(mode: str, images: list[dict[str, str]], provided_key: str = "", context: dict | None = None) -> dict:
    api_key = provided_key.strip() or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY가 설정되지 않았습니다.")

    if mode == "word":
        context = context or {}
        word = str(context.get("word") or "").strip()
        sentence = str(context.get("sentence") or "").strip()
        if not word or not sentence:
            raise ValueError("뜻을 찾을 단어와 문장이 필요합니다.")
        prompt = (
            f"English sentence: {sentence}\nTarget word: {word}\n"
            "Return the target word and one short, natural Korean meaning that fits this exact sentence. "
            "Do not explain and do not give multiple meanings."
        )
    elif mode == "sentence":
        context = context or {}
        sentence = str(context.get("sentence") or "").strip()
        if not sentence:
            raise ValueError("분석할 영어 문장이 필요합니다.")
        prompt = prompt_for("body") + f" Analyze exactly this one supplied sentence and return exactly one item: {sentence}"
    else:
        prompt = prompt_for(mode)
    parts: list[dict] = [{"text": prompt}]
    for image in images:
        mime_type = str(image.get("mimeType") or "")
        data = str(image.get("data") or "")
        if not mime_type.startswith("image/") or not data:
            raise ValueError("올바른 이미지 데이터가 아닙니다.")
        parts.append({"inlineData": {"mimeType": mime_type, "data": data}})

    schema = WORD_SCHEMA if mode == "word" else TITLE_SCHEMA if mode == "cover" else BODY_SCHEMA
    payload = {
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": {
            "temperature": 0.1,
            "responseMimeType": "application/json",
            "responseSchema": schema,
        },
    }
    endpoint = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{quote(MODEL, safe='-._')}:generateContent"
    )
    request = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        try:
            message = json.loads(detail).get("error", {}).get("message", "")
        except json.JSONDecodeError:
            message = ""
        raise RuntimeError(message or f"Gemini 요청에 실패했습니다. ({error.code})") from error
    except urllib.error.URLError as error:
        raise RuntimeError("Gemini 서버에 연결하지 못했습니다.") from error

    candidates = result.get("candidates") or []
    response_parts = candidates[0].get("content", {}).get("parts", []) if candidates else []
    text = "".join(str(part.get("text") or "") for part in response_parts).strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.IGNORECASE)
    if not text:
        raise RuntimeError("Gemini가 사진에서 내용을 찾지 못했습니다.")
    try:
        return json.loads(text)
    except json.JSONDecodeError as error:
        raise RuntimeError("Gemini 응답을 문장 데이터로 변환하지 못했습니다.") from error


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        if self.path == "/api/gemini/status":
            configured = bool(os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY"))
            self.send_json(200, {"configured": configured, "model": MODEL})
            return
        super().do_GET()

    def do_POST(self) -> None:
        if self.path != "/api/gemini/analyze":
            self.send_json(404, {"error": "찾을 수 없는 요청입니다."})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > MAX_REQUEST_BYTES:
                raise ValueError("사진 한 장의 크기는 20MB보다 작아야 합니다.")
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            mode = str(payload.get("mode") or "")
            images = payload.get("images") or []
            if mode not in {"cover", "body", "word", "sentence"}:
                raise ValueError("지원하지 않는 Gemini 요청입니다.")
            if mode in {"cover", "body"} and (not isinstance(images, list) or not images):
                raise ValueError("분석할 사진이 없습니다.")
            api_key = str(payload.get("apiKey") or "")
            self.send_json(200, gemini_request(mode, images[:1], api_key, payload))
        except (ValueError, RuntimeError, json.JSONDecodeError) as error:
            self.send_json(400, {"error": str(error)})
        except Exception:
            self.send_json(500, {"error": "사진 분석 중 예상하지 못한 문제가 생겼습니다."})


if __name__ == "__main__":
    print(f"LostPeaceAdventure Gemini server: http://{HOST}:{PORT}")
    print(f"Gemini model: {MODEL}")
    ThreadingHTTPServer((HOST, PORT), AppHandler).serve_forever()
