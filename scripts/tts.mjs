// Record the six lines in Yar's ElevenLabs voice, with word timings.
//
//   node scripts/tts.mjs
//
// Uses /with-timestamps so the karaoke captions come from the synthesizer's own
// character alignment rather than a transcription pass. Each line is sent with
// its neighbours as previous_text / next_text so prosody stays continuous across
// the six files. Writes .media/audio/voice/NN.wav and audio_meta.json.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
for (const file of [resolve(root, ".env.local"), resolve(root, ".env")]) {
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}
const key = process.env.ELEVENLABS_API_KEY;
const voice = process.env.ELEVENLABS_VOICE_ID;
if (!key || !voice) throw new Error("ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID missing");

const spec = JSON.parse(readFileSync(resolve(root, "script.json"), "utf8"));
const lines = spec.lines.map((l, i) => ({ id: String(i + 1).padStart(2, "0"), text: l.text }));
const outDir = resolve(root, ".media/audio/voice");
mkdirSync(outDir, { recursive: true });

// Group characters into words: a word is a run of non-space characters; its
// start is the first char's start, its end the last char's end.
function wordsFrom(alignment) {
  const { characters, character_start_times_seconds: s, character_end_times_seconds: e } = alignment;
  const words = [];
  let cur = null;
  characters.forEach((ch, i) => {
    if (/\s/.test(ch)) { if (cur) { words.push(cur); cur = null; } return; }
    if (!cur) cur = { text: "", start: s[i], end: e[i] };
    cur.text += ch;
    cur.end = e[i];
  });
  if (cur) words.push(cur);
  return words.map((w, i) => ({ id: `w${i}`, ...w }));
}

const voices = [];
for (let i = 0; i < lines.length; i++) {
  const { id, text } = lines[i];
  const body = {
    text,
    model_id: "eleven_multilingual_v2",
    previous_text: lines[i - 1]?.text,
    next_text: lines[i + 1]?.text,
    voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true },
  };
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": key, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`line ${id}: ${r.status} ${await r.text()}`);
  const json = await r.json();
  const mp3 = resolve(outDir, `${id}.mp3`);
  const wav = resolve(outDir, `${id}.wav`);
  writeFileSync(mp3, Buffer.from(json.audio_base64, "base64"));
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", mp3, "-ar", "44100", "-ac", "1", wav]);
  const dur = parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav]).toString());
  const words = wordsFrom(json.alignment);
  voices.push({ id, text, path: `.media/audio/voice/${id}.wav`, duration_s: +dur.toFixed(3), words });
  console.log(id, dur.toFixed(2) + "s", words.length, "words");
}
writeFileSync(resolve(root, "audio_meta.json"), JSON.stringify({ tts_provider: "elevenlabs", voice_id: voice, voices, total_duration_s: +voices.reduce((a, v) => a + v.duration_s, 0).toFixed(3) }, null, 2));
console.log("total", voices.reduce((a, v) => a + v.duration_s, 0).toFixed(2) + "s");
