// Generate index.html from audio_meta.json + script.json. Beat durations are the
// real voice durations; captions and every word-cued move come from the
// synthesizer's word alignment. After re-recording:
//
//   node scripts/build.mjs && node <hyperframes-audio>/scripts/carve.mjs --comp index.html --bed bgm --strength 0.35
//
// The visual system uses a progress rail, headline pills, a scene card,
// karaoke captions, blocky characters, and mini-Yar, dressed in AVC colours:
// white ground, ink, and yellow.
// B-roll is the real Google Flow UI, from Kevin Stratvert's tutorial
// (youtube.com/watch?v=0vQ7UEe7rLg) — see research/.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const mediaDur = (f) => +parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", resolve(root, f)]).toString()).toFixed(3);
const meta = JSON.parse(readFileSync(resolve(root, "audio_meta.json"), "utf8"));
const spec = JSON.parse(readFileSync(resolve(root, "script.json"), "utf8"));
const voices = [...meta.voices].sort((a, b) => a.id.localeCompare(b.id));

const HOLD = 1.2;
const W = 1080, H = 1920;
const CARD = { w: 1002, h: 784 };

// AVC palette
const INK = "#0B0B0B", YEL = "#FFE01A", YEL_D = "#E8C400", PAPER = "#FFFFFF", MIST = "#F4F4F1", LINE = "#E6E6E1", GREY = "#6B6B66";

// ── beats ────────────────────────────────────────────────────────────────────
let t = 0;
const beats = voices.map((v, i) => {
  const b = { i: i + 1, start: +t.toFixed(3), dur: v.duration_s, words: v.words };
  t += v.duration_s;
  return b;
});
const TOTAL = +(t + HOLD).toFixed(3);
const B = Object.fromEntries(beats.map((b) => [b.i, b]));
const beatEnd = (b) => (b.i === 6 ? TOTAL : B[b.i + 1].start);
const at = (b, wordText, nth = 0) => {
  const hits = b.words.filter((w) => w.text.toLowerCase().replace(/[^a-z0-9$×@]/g, "").startsWith(wordText.toLowerCase()));
  if (!hits[nth]) throw new Error(`beat ${b.i}: word "${wordText}" #${nth} not found`);
  return +(b.start + hits[nth].start).toFixed(3);
};

const pills = {
  1: ["Google Flow", "Is a full film studio"],
  2: ["Step 1: New project", "It asks you first"],
  3: ["Step 2: Storyboard", "Edits cost 0 credits"],
  4: ["Step 3: Every clip", "6 shots = 90 credits"],
  5: ["Step 4: Characters", "Tag them with @"],
  6: ["Step 5: Export", "Save this for later"],
};

// ── caption chunks ───────────────────────────────────────────────────────────
function chunk(b) {
  const MAX = 26;
  const len = (ws) => ws.map((w) => w.text).join(" ").length;
  const sentences = [];
  let cur = [];
  for (const w of b.words) {
    cur.push(w);
    if (/[.,]$/.test(w.text)) { sentences.push(cur); cur = []; }
  }
  if (cur.length) sentences.push(cur);
  const pieces = [];
  for (const sent of sentences) {
    const total = len(sent);
    const n = Math.max(1, Math.ceil(total / MAX));
    let piece = [], made = 0, cum = 0;
    for (const w of sent) {
      piece.push(w);
      cum += w.text.length + 1;
      if (made < n - 1 && cum >= (total / n) * (made + 1)) { pieces.push(piece); piece = []; made++; }
    }
    if (piece.length) pieces.push(piece);
  }
  return pieces.map((ws) => ({ start: +(b.start + ws[0].start).toFixed(3), words: ws.map((w) => ({ text: w.text, at: +(b.start + w.start).toFixed(3) })) }));
}
const chunks = beats.flatMap(chunk);
chunks.forEach((c, i) => { c.end = i + 1 < chunks.length ? chunks[i + 1].start : TOTAL; });

// ── rail ─────────────────────────────────────────────────────────────────────
const RAIL = { y: 292, x0: 80, x1: 1000 };
const stopX = (i) => 110 + (i - 1) * 160;
const FLAG_X = RAIL.x1;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const clip = (id, start, dur, cls, inner, track = 1, extra = "") =>
  `<div id="${id}" class="clip ${cls}" data-start="${start}" data-duration="${+dur.toFixed(3)}" data-track-index="${track}"${extra}>${inner}</div>`;

// ── bots ─────────────────────────────────────────────────────────────────────
const SKINS = ["#F2A33A", "#FFE01A", "#3FB8A5", "#4A8FE7", "#F07A6A", "#8E6BD9", "#6CBF5A", "#F28DB2", "#E8734A", "#5CC8E8"];
const SHIRTS = ["#2B4C9B", "#0B0B0B", "#DC5A2B", "#FFFFFF", "#2E9E5B", "#C63D2F", "#FFE01A", "#6B4FBB"];
const HATS = ["", "cap", "hard", "phones", "", "beanie", ""];
const EYES = ["", "glasses", "", "shades", "", "glasses", ""];
const MOUTHS = ["smile", "", "smile", "o", "", "smile"];
const TIES = ["", "tie", "", "pocket", "bow", "", "badge"];
function bot({ id, w = 120, x = 0, side = "l", k = 0, yar = false, skin, shirt, hat, eyes, mouth, tie }) {
  skin ??= SKINS[k % SKINS.length];
  shirt ??= SHIRTS[(k * 3 + 1) % SHIRTS.length];
  hat ??= HATS[k % HATS.length];
  eyes ??= EYES[(k + 2) % EYES.length];
  mouth ??= MOUTHS[k % MOUTHS.length];
  tie ??= TIES[(k + 1) % TIES.length];
  if (shirt === skin) shirt = INK;
  const head = yar
    ? `<div class="bot-head bot-head-yar"><img src="public/yar-head.png" alt="" /></div>`
    : `<div class="bot-head">
        ${hat === "cap" ? `<div class="bot-cap"></div><div class="bot-brim"></div>` : ""}
        ${hat === "hard" ? `<div class="bot-hard"></div>` : ""}
        ${hat === "beanie" ? `<div class="bot-beanie"></div>` : ""}
        ${hat === "phones" ? `<div class="bot-phones"></div>` : ""}
        <i class="bot-eye l"></i><i class="bot-eye r"></i>
        ${eyes === "glasses" ? `<div class="bot-glasses"><i></i><i></i></div>` : ""}
        ${eyes === "shades" ? `<div class="bot-shades"></div>` : ""}
        ${mouth ? `<i class="bot-mouth ${mouth}"></i>` : ""}
      </div>`;
  return `<div class="bot ${yar ? "bot-yar" : ""}" id="${id}" data-side="${side}" style="--w:${w}px; --skin:${skin}; --shirt:${shirt}; left:${x}px">
    <div class="bot-rig">
      ${head}
      <div class="bot-body">${tie === "tie" ? `<i class="bot-tie"></i>` : ""}${tie === "bow" ? `<i class="bot-bow"></i>` : ""}${tie === "pocket" ? `<i class="bot-pocket"></i>` : ""}${tie === "badge" ? `<i class="bot-badge"></i>` : ""}</div>
      <div class="bot-arm l"></div><div class="bot-arm r"></div>
      <div class="bot-leg l"></div><div class="bot-leg r"></div>
    </div>
  </div>`;
}
const crowds = {
  1: [[30, 96, 0, "l"], [140, 112, 1, "l"], [700, 100, 3, "r"], [810, 118, 4, "r"]],
  2: [[860, 104, 6, "r"]],
  3: [[40, 100, 10, "l"], [880, 96, 11, "r"]],
  4: [[30, 100, 12, "l"], [150, 108, 13, "l"], [740, 96, 14, "r"], [860, 112, 15, "r"]],
  5: [[30, 104, 17, "l"], [150, 94, 18, "l"], [760, 100, 19, "r"], [880, 100, 20, "r"]],
  6: [[40, 100, 21, "l"], [160, 92, 22, "l"], [880, 104, 23, "r"]],
};
const YAR_SHIRT = INK;
const crowdHtml = (i) => crowds[i].map(([x, w, k, side], j) => bot({ id: `b${i}-bot${j}`, w, x, k, side })).join("");
const avcTile = (cls = "") => `<div class="avc ${cls}"><span>AVC</span></div>`;

// ── card contents ────────────────────────────────────────────────────────────
const card = {
  1: `
    <div class="shot b1-shot" id="b1shot"><img src="public/broll/flow-home.png" alt="" /></div>
    <div class="chip chip-yel b1-url" id="b1url"><img class="g" src="public/logos/google.svg" alt="" />flow.google</div>
    <div class="b1-prompt" id="b1prompt"><span class="b1-prompt-text">1 prompt</span><i class="b1-strike" id="b1strike"></i></div>
    ${crowdHtml(1)}
    ${bot({ id: "b1-yar", w: 150, x: 426, side: "c", yar: true, shirt: YAR_SHIRT })}`,
  2: `
    <div class="shot b2-shot" id="b2shot"><img src="public/broll/flow-questions.png" alt="" />
      <div class="hl" id="hl-vibe"></div><div class="hl" id="hl-hero"></div><div class="hl" id="hl-style"></div>
    </div>
    <div class="chip chip-ink b2-url" id="b2url">New project</div>
    <div class="chip chip-yel b2-c b2-c1" id="b2c1">Vibe</div>
    <div class="chip chip-yel b2-c b2-c2" id="b2c2">Hero shot</div>
    <div class="chip chip-yel b2-c b2-c3" id="b2c3">Style</div>
    ${crowdHtml(2)}
    ${bot({ id: "b2-yar", w: 140, x: 100, side: "l", yar: true, shirt: YAR_SHIRT })}`,
  3: `
    <div class="shot b3-shot" id="b3shot"><img id="b3img" src="public/broll/flow-storyboard-text.png" alt="" /></div>
    <div class="chip chip-ink b3-c b3-c1" id="b3c1">Characters</div>
    <div class="chip chip-ink b3-c b3-c2" id="b3c2">Camera angles</div>
    <div class="chip chip-ink b3-c b3-c3" id="b3c3">Dialogue</div>
    <div class="b3-stamp" id="b3stamp"><b>0</b> credits</div>
    ${crowdHtml(3)}`,
  4: `
    <div class="shot b4-board" id="b4board"><img src="public/broll/flow-storyboard-grid.png" alt="" /></div>
    <div class="shot b4-clips" id="b4clips"><img src="public/broll/flow-clips.png" alt="" /></div>
    <div class="b4-flash" id="b4flash"></div>
    <div class="shot b4-approve" id="b4approve"><img src="public/broll/flow-approve.png" alt="" /><div class="hl" id="hl-90"></div></div>
    <div class="chip chip-ink b4-c1" id="b4c1">6 shots</div>
    <div class="chip chip-yel b4-c2" id="b4c2">90 credits</div>
    ${crowdHtml(4)}`,
  5: `
    <div class="shot b5-chars" id="b5chars"><img src="public/broll/flow-characters.png" alt="" /></div>
    <div class="shot b5-silas" id="b5silas"><img src="public/broll/flow-silas.png" alt="" /></div>
    <div class="chip chip-yel b5-tag" id="b5tag">@Silas</div>
    <div class="chip chip-ink b5-same" id="b5same">Same person, every shot</div>
    <div class="chip chip-yel b5-you" id="b5you">Even you</div>
    ${crowdHtml(5)}
    ${bot({ id: "b5-yar", w: 150, x: 426, side: "c", yar: true, shirt: YAR_SHIRT })}`,
  6: `
    <div class="shot b6-shot" id="b6shot"><img src="public/broll/flow-timeline.png" alt="" /><i class="playhead" id="playhead"></i></div>
    <div class="chip chip-ink b6-c1" id="b6c1">Trim</div>
    <div class="chip chip-yel b6-c2" id="b6c2">↓ Export</div>
    ${crowdHtml(6)}
    ${bot({ id: "b6-yar", w: 140, x: 440, side: "c", yar: true, shirt: YAR_SHIRT })}`,
};

// ── HTML ─────────────────────────────────────────────────────────────────────
const stopsHtml = beats.map((b) => `
      <div class="stop" data-layout-allow-occlusion style="left:${stopX(b.i) - 22}px">
        <span class="stop-num">${b.i}</span>
        <svg class="stop-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="${YEL}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>`).join("");

const pillsHtml = beats.map((b) => clip(`pill-${b.i}`, b.start, beatEnd(b) - b.start, "pill-slot", `
      <div class="pill" id="pill-in-${b.i}">
        ${avcTile("pill-logo")}
        <div class="pill-text"><div class="pill-l1">${esc(pills[b.i][0])}</div><div class="pill-l2"><span>${esc(pills[b.i][1])}</span></div></div>
      </div>`, 2)).join("");

const cardsHtml = beats.map((b) => clip(`beat-${b.i}`, b.start, beatEnd(b) - b.start, `card-beat b${b.i}`, `<div class="beat-inner" id="inner-${b.i}">${card[b.i]}</div>`)).join("");

const capsHtml = chunks.map((c, i) => clip(`cap-${i}`, c.start, c.end - c.start, "cap",
  `<div class="cap-ghost" data-layout-ignore>${c.words.map((w) => `<span class="w">${esc(w.text)}</span>`).join(" ")}</div>` +
  `<div class="cap-live">${c.words.map((w, j) => `<span class="w" id="cap-${i}-${j}">${esc(w.text)}</span>`).join(" ")}</div>`, 3)).join("");

const confettiHtml = Array.from({ length: 36 }, (_, i) => `<span class="cf" style="--c:${[YEL, INK, YEL, "#4A8FE7", YEL_D, "#F07A6A"][i % 6]}"></span>`).join("");

const bgmDur = mediaDur("public/bgm.wav");
const CTA_AT = +(B[6].start + B[6].dur - 0.9).toFixed(3);
const audioHtml = beats.map((b) => `
    <audio id="vo-${b.i}" src=".media/audio/voice/${String(b.i).padStart(2, "0")}.wav" data-start="${b.start}" data-duration="${b.dur}" data-track-index="10" data-volume="1"></audio>`).join("") +
  [["pop", 1], ["whoosh-short", 2], ["click", 3], ["impact-bass-1", 4], ["ping", 5], ["pop", 6]].map(([n, i]) => `
    <audio id="sfx-${i}" src="public/sfx/${n}.mp3" data-start="${B[i].start}" data-duration="${mediaDur(`public/sfx/${n}.mp3`)}" data-track-index="11" data-volume="0.35"></audio>`).join("") +
  `
    <audio id="sfx-cta" src="public/sfx/whoosh-short.mp3" data-start="${CTA_AT}" data-duration="${mediaDur("public/sfx/whoosh-short.mp3")}" data-track-index="11" data-volume="0.4"></audio>
    <audio id="bgm" src="public/bgm.wav" data-start="0" data-duration="${Math.min(bgmDur, TOTAL)}" data-track-index="12" data-volume="0.55"></audio>`;

const data = {
  total: TOTAL,
  beats: beats.map((b) => ({ i: b.i, start: b.start, dur: b.dur, end: beatEnd(b) })),
  stops: beats.map((b) => stopX(b.i)),
  rail: RAIL, flagX: FLAG_X,
  caps: chunks.map((c, i) => c.words.map((w, j) => ({ id: `cap-${i}-${j}`, at: w.at }))).flat(),
  cues: {
    b1_studio: at(B[1], "studio"), b1_one: at(B[1], "one"), b1_hope: at(B[1], "hope"),
    b2_new: at(B[2], "new"), b2_flow: at(B[2], "flow"), b2_vibe: at(B[2], "vibe"), b2_hero: at(B[2], "hero"), b2_style: at(B[2], "style"),
    b3_storyboard: at(B[3], "storyboard"), b3_characters: at(B[3], "characters"), b3_camera: at(B[3], "camera"), b3_dialogue: at(B[3], "dialogue"), b3_zero: at(B[3], "zero"), b3_fix: at(B[3], "fix"),
    b4_generates: at(B[4], "generates"), b4_six: at(B[4], "six"), b4_ninety: at(B[4], "ninety"), b4_film: at(B[4], "film"),
    b5_create: at(B[5], "create"), b5_at: at(B[5], "at"), b5_same: at(B[5], "same"), b5_yourself: at(B[5], "yourself"),
    b6_timeline: at(B[6], "timeline"), b6_trim: at(B[6], "trim"), b6_export: at(B[6], "export"), b6_save: at(B[6], "save"), cta: CTA_AT,
  },
};

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      @font-face { font-family: "Fraunces"; font-weight: 800; font-style: normal; src: url("public/fonts/fraunces-800.woff2") format("woff2"); }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: ${PAPER}; }
      body { font-family: "Inter", sans-serif; color: ${INK}; -webkit-font-smoothing: antialiased; }
      #root { position: absolute; inset: 0; width: ${W}px; height: ${H}px; overflow: hidden;
        background: radial-gradient(110% 70% at 50% 28%, #FFFFFF 0%, #FBFBF8 55%, #F3F3EE 100%); }
      #root::before { content: ""; position: absolute; inset: 0; background-image: radial-gradient(#E4E4DE 2px, transparent 2px); background-size: 46px 46px; opacity: .5; }
      .clip { position: absolute; }
      .blob { position: absolute; border-radius: 50%; background: ${YEL}; opacity: .22; }
      .blob1 { right: -160px; top: 1360px; width: 520px; height: 520px; }
      .blob2 { left: -140px; top: 120px; width: 300px; height: 300px; opacity: .16; }
      .ghost-avc { position: absolute; right: 70px; top: 1540px; width: 220px; height: 220px; opacity: .08; }

      /* AVC tile */
      .avc { background: ${INK}; border-radius: 26%; display: grid; place-items: center; }
      .avc span { color: ${YEL}; font-family: "Montserrat", sans-serif; font-weight: 900; letter-spacing: -.02em; }
      .ghost-avc span { font-size: 70px; }

      /* rail */
      .rail { position: absolute; left: 0; top: 0; width: ${W}px; height: 400px; z-index: 6; }
      .rail-track { position: absolute; left: ${RAIL.x0}px; top: ${RAIL.y - 6}px; width: ${RAIL.x1 - RAIL.x0}px; height: 12px; border-radius: 6px; background: ${LINE}; }
      .rail-fill { position: absolute; left: ${RAIL.x0}px; top: ${RAIL.y - 6}px; width: ${RAIL.x1 - RAIL.x0}px; height: 12px; border-radius: 6px; background: ${YEL}; box-shadow: inset 0 0 0 2px ${INK}; transform-origin: 0 50%; }
      .stop { position: absolute; top: ${RAIL.y - 22}px; width: 44px; height: 44px; border-radius: 50%; background: ${PAPER}; border: 3px solid ${LINE};
        display: grid; place-items: center; font-weight: 700; font-size: 22px; color: ${GREY}; }
      .stop-num { grid-area: 1/1; }
      .stop-check { grid-area: 1/1; width: 26px; height: 26px; opacity: 0; }
      .marker { position: absolute; left: ${stopX(1) - 40}px; top: ${RAIL.y - 92}px; width: 80px; height: 116px; }
      .marker .bot { left: 6px; bottom: 0; }
      .marker-ring { position: absolute; left: 10px; bottom: 6px; width: 60px; height: 18px; border-radius: 50%; background: ${YEL}; border: 2px solid ${INK}; }
      .flag { position: absolute; left: ${FLAG_X - 26}px; top: ${RAIL.y - 26}px; width: 52px; height: 52px; border-radius: 14px; background: ${INK}; display: grid; place-items: center; }
      .flag svg { width: 28px; height: 28px; }

      /* pill */
      .pill-slot { left: 0; top: 330px; width: ${W}px; height: 160px; display: flex; justify-content: center; align-items: flex-start; z-index: 5; }
      .pill { display: flex; align-items: center; gap: 22px; padding: 16px 40px 16px 16px; background: ${PAPER}; border-radius: 34px;
        box-shadow: 0 14px 34px rgba(20, 20, 10, .14); border: 3px solid ${INK}; }
      .pill-logo { width: 112px; height: 112px; flex: none; }
      .pill-logo span { font-size: 40px; }
      .pill-text { font-weight: 900; font-size: 46px; line-height: 1.1; text-transform: uppercase; letter-spacing: -.012em; white-space: nowrap; }
      .pill-l1 { color: ${INK}; }
      .pill-l2 span { display: inline-block; background: ${YEL}; color: ${INK}; padding: 0 12px; margin-left: -12px; border-radius: 8px; margin-top: 4px; }

      /* card */
      .card { position: absolute; left: 36px; top: 380px; width: 1008px; height: 790px; border-radius: 38px; background: ${MIST}; border: 3px solid ${INK};
        box-shadow: 10px 12px 0 ${YEL}, 0 24px 60px rgba(20, 20, 10, .10); overflow: hidden; }
      .card-beat { left: 0; top: 0; width: ${CARD.w}px; height: ${CARD.h}px; overflow: hidden; }
      .beat-inner { position: absolute; inset: 0; }
      .floor { position: absolute; left: 0; bottom: 0; width: ${CARD.w}px; height: 24px; background: linear-gradient(180deg, rgba(20,20,10,.04), rgba(20,20,10,.10)); }
      .shot { position: absolute; overflow: hidden; border-radius: 22px; border: 3px solid ${INK}; background: #111; box-shadow: 0 16px 36px rgba(20,20,10,.18); transform-origin: 50% 50%; }
      .shot img { position: absolute; left: 0; top: 0; display: block; }
      .chip { position: absolute; transform-origin: 50% 50%; padding: 14px 26px; border-radius: 999px; font-weight: 900; font-size: 30px; letter-spacing: .01em; text-transform: uppercase; white-space: nowrap;
        border: 3px solid ${INK}; box-shadow: 4px 5px 0 ${INK}; z-index: 3; display: flex; align-items: center; gap: 12px; }
      .chip-yel { background: ${YEL}; color: ${INK}; }
      .chip-ink { background: ${INK}; color: ${YEL}; box-shadow: 4px 5px 0 ${YEL}; }
      .chip .g { width: 32px; height: 32px; }
      .hl { position: absolute; border: 6px solid ${YEL}; border-radius: 12px; box-shadow: 0 0 0 3px ${INK}, 0 0 24px rgba(255, 224, 26, .55); transform-origin: 50% 50%; opacity: 0; }

      /* bots */
      .bot { position: absolute; bottom: 10px; width: var(--w); height: calc(var(--w) * 1.42); font-size: calc(var(--w) / 100); z-index: 2; }
      .bot-rig { position: absolute; inset: 0; transform-origin: 50% 100%; }
      .bot-head { position: absolute; left: 8em; top: 0; width: 84em; height: 70em; border-radius: 12em; background: var(--skin);
        box-shadow: inset -11em 0 0 rgba(0,0,0,.14), inset 0 7em 0 rgba(255,255,255,.22); transform-origin: 50% 100%; }
      .bot-head-yar { background: #F2EDE4; overflow: hidden; border: 4em solid ${YEL}; box-shadow: 0 0 0 2.5em ${INK}, 0 4em 12em rgba(20,20,10,.25); }
      .bot-head-yar img { position: absolute; left: 0; top: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 15%; display: block; }
      .bot-eye { position: absolute; top: 30em; width: 10em; height: 11em; background: ${INK}; border-radius: 2em; }
      .bot-eye.l { left: 22em; } .bot-eye.r { left: 52em; }
      .bot-mouth { position: absolute; left: 34em; top: 50em; width: 16em; height: 5em; background: ${INK}; border-radius: 0 0 6em 6em; }
      .bot-mouth.o { left: 37em; width: 10em; height: 9em; border-radius: 50%; }
      .bot-glasses { position: absolute; left: 14em; top: 24em; width: 56em; height: 22em; display: flex; justify-content: space-between; }
      .bot-glasses i { width: 24em; height: 22em; border: 3.5em solid ${INK}; border-radius: 6em; background: rgba(255,255,255,.35); }
      .bot-shades { position: absolute; left: 16em; top: 26em; width: 52em; height: 18em; background: ${INK}; border-radius: 4em; }
      .bot-cap { position: absolute; left: -2em; top: -10em; width: 88em; height: 20em; background: var(--shirt); border-radius: 10em 10em 3em 3em; box-shadow: inset -8em 0 0 rgba(0,0,0,.14); }
      .bot-brim { position: absolute; left: 60em; top: 4em; width: 34em; height: 8em; background: var(--shirt); border-radius: 0 4em 4em 0; }
      .bot-hard { position: absolute; left: -4em; top: -14em; width: 92em; height: 26em; background: ${YEL}; border-radius: 40em 40em 4em 4em; box-shadow: inset -10em 0 0 rgba(0,0,0,.12); }
      .bot-beanie { position: absolute; left: -2em; top: -12em; width: 88em; height: 22em; background: #C63D2F; border-radius: 30em 30em 4em 4em; box-shadow: inset 0 -6em 0 rgba(255,255,255,.25); }
      .bot-phones { position: absolute; left: -8em; top: 18em; width: 100em; height: 30em; border: 6em solid ${INK}; border-bottom: none; border-radius: 40em 40em 0 0; }
      .bot-body { position: absolute; left: 18em; top: 66em; width: 64em; height: 46em; border-radius: 8em; background: var(--shirt); box-shadow: inset -9em 0 0 rgba(0,0,0,.14); }
      .bot-tie { position: absolute; left: 27em; top: 2em; width: 10em; height: 26em; background: #C63D2F; clip-path: polygon(0 0, 100% 0, 80% 100%, 20% 100%); }
      .bot-bow { position: absolute; left: 20em; top: 4em; width: 24em; height: 10em; background: #C63D2F; clip-path: polygon(0 0, 50% 40%, 100% 0, 100% 100%, 50% 60%, 0 100%); }
      .bot-pocket { position: absolute; left: 10em; top: 10em; width: 14em; height: 12em; background: rgba(255,255,255,.35); border-radius: 2em; }
      .bot-badge { position: absolute; left: 40em; top: 10em; width: 12em; height: 12em; background: ${YEL}; border-radius: 50%; }
      .bot-arm { position: absolute; top: 70em; width: 13em; height: 30em; border-radius: 5em; background: var(--skin); transform-origin: 50% 10%; box-shadow: inset -4em 0 0 rgba(0,0,0,.12); }
      .bot-arm.l { left: 4em; } .bot-arm.r { left: 83em; }
      .bot-leg { position: absolute; top: 108em; width: 22em; height: 34em; border-radius: 4em 4em 6em 6em; background: var(--skin); transform-origin: 50% 0; box-shadow: inset 0 -9em 0 ${INK}, inset -5em 0 0 rgba(0,0,0,.12); }
      .bot-leg.l { left: 24em; } .bot-leg.r { left: 54em; }
      .bot-yar .bot-body { background: ${INK}; box-shadow: inset 0 -8em 0 ${YEL}; }
      .bot-yar .bot-leg { background: #2B4C9B; }
      .bot-yar .bot-arm { background: #D9A47E; }

      /* beat 1: Flow home, "1 prompt" struck out */
      .b1-shot { left: 60px; top: 118px; width: 882px; height: 496px; }
      .b1-shot img { width: 882px; height: 496px; transform-origin: 30% 30%; }
      .b1-url { left: 84px; top: 540px; }
      .b1-prompt { position: absolute; right: 70px; top: 150px; padding: 14px 30px; background: ${PAPER}; border: 4px solid ${INK}; border-radius: 18px; transform-origin: 50% 50%; z-index: 3; box-shadow: 6px 7px 0 ${YEL}; }
      .b1-prompt-text { font-weight: 900; font-size: 54px; text-transform: uppercase; color: ${INK}; }
      .b1-strike { position: absolute; left: 14px; top: 50%; width: calc(100% - 28px); height: 10px; margin-top: -5px; background: #E0322B; border-radius: 5px; transform-origin: 0 50%; display: block; }

      /* beat 2: the assistant asks first */
      .b2-shot { left: 330px; top: 112px; width: 640px; height: 624px; }
      .b2-shot img { width: 640px; height: 624px; }
      #hl-vibe  { left: 14px; top: 352px; width: 612px; height: 48px; }
      #hl-hero  { left: 14px; top: 414px; width: 612px; height: 72px; }
      #hl-style { left: 14px; top: 502px; width: 612px; height: 62px; }
      .b2-url { left: 34px; top: 124px; }
      .b2-c { left: 34px; }
      .b2-c1 { top: 232px; } .b2-c2 { top: 322px; } .b2-c3 { top: 412px; }

      /* beat 3: storyboard text scrolls; 0 credits stamp */
      .b3-shot { left: 470px; top: 112px; width: 500px; height: 520px; }
      .b3-shot img { width: 500px; height: 692px; }
      .b3-c { left: 34px; }
      .b3-c1 { top: 132px; } .b3-c2 { top: 222px; } .b3-c3 { top: 312px; }
      .b3-stamp { position: absolute; left: 34px; top: 420px; padding: 8px 26px 12px; background: ${YEL}; border: 5px solid ${INK}; border-radius: 20px; box-shadow: 8px 9px 0 ${INK};
        font-weight: 900; font-size: 56px; text-transform: uppercase; letter-spacing: -.02em; color: ${INK}; z-index: 4; transform-origin: 50% 50%; }
      .b3-stamp b { font-size: 110px; line-height: .9; margin-right: 10px; }

      /* beat 4: storyboard grid → clips; approve with 90 credits */
      .b4-board { left: 60px; top: 118px; width: 600px; height: 343px; }
      .b4-board img { width: 600px; height: 343px; }
      .b4-clips { left: 40px; top: 112px; width: 620px; height: 534px; opacity: 0; }
      .b4-clips img { width: 620px; height: 534px; }
      .b4-flash { position: absolute; left: 40px; top: 112px; width: 620px; height: 534px; border-radius: 22px; background: ${YEL}; opacity: 0; z-index: 2; }
      .b4-approve { left: 690px; top: 150px; width: 290px; height: 348px; }
      .b4-approve img { width: 290px; height: 348px; }
      #hl-90 { left: 6px; top: 178px; width: 270px; height: 32px; border-width: 5px; border-radius: 8px; }
      .b4-c1 { left: 700px; top: 530px; }
      .b4-c2 { left: 700px; top: 616px; }

      /* beat 5: characters → @Silas at the train station → you */
      .b5-chars { left: 177px; top: 116px; width: 648px; height: 516px; }
      .b5-chars img { width: 648px; height: 516px; }
      .b5-silas { left: 40px; top: 116px; width: 922px; height: 343px; opacity: 0; }
      .b5-silas img { width: 922px; height: 343px; }
      .b5-tag { left: 60px; top: 480px; }
      .b5-same { right: 40px; top: 480px; }
      .b5-you { left: 590px; top: 580px; }

      /* beat 6: timeline + playhead */
      .b6-shot { left: 30px; top: 112px; width: 942px; height: 530px; }
      .b6-shot img { width: 942px; height: 530px; }
      .playhead { position: absolute; left: 8px; top: 380px; width: 6px; height: 80px; background: ${YEL}; box-shadow: 0 0 0 2px ${INK}; border-radius: 3px; display: block; }
      .b6-c1 { left: 60px; top: 572px; }
      .b6-c2 { right: 60px; top: 572px; }

      /* caption */
      .cap { left: 70px; top: 1235px; width: 940px; font-family: "Fraunces", "Playfair Display", serif; font-weight: 800; font-size: 62px; line-height: 1.22; }
      .cap-ghost, .cap-live { position: absolute; left: 0; top: 0; width: 940px; text-align: center; }
      .cap-ghost { color: #D9D9D2; }
      .cap-live { color: ${INK}; }
      .cap-live .w { opacity: 0; display: inline-block; transform-origin: 50% 80%; }

      /* cta + confetti + handle */
      .cta { left: 0; top: 1455px; width: ${W}px; display: flex; justify-content: center; }
      .cta-chip { display: inline-flex; align-items: center; gap: 18px; padding: 14px 34px 14px 14px; border-radius: 999px; background: ${YEL}; color: ${INK}; font-weight: 900; font-size: 32px;
        border: 4px solid ${INK}; box-shadow: 6px 7px 0 ${INK}; }
      .cta-chip .avc { width: 64px; height: 64px; }
      .cta-chip .avc span { font-size: 22px; }
      .confetti { left: 0; top: 1200px; width: ${W}px; height: 700px; }
      .cf { position: absolute; left: 540px; top: 300px; width: 14px; height: 22px; border-radius: 3px; background: var(--c); opacity: 0; }
      .handle { position: absolute; left: 0; top: 1790px; width: ${W}px; text-align: center; font-weight: 700; font-size: 28px; letter-spacing: .04em; color: ${GREY}; }
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="${W}" data-height="${H}">
      <div class="blob blob1" id="blob1"></div>
      <div class="blob blob2" id="blob2"></div>
      <div class="avc ghost-avc" id="ghostavc" data-layout-ignore><span>AVC</span></div>

      <div class="rail">
        <div class="rail-track"></div>
        <div class="rail-fill" id="rail-fill"></div>${stopsHtml}
        <div class="flag" id="flag"><svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z" fill="${YEL}"/></svg></div>
        <div class="marker" id="marker"><div class="marker-ring"></div>${bot({ id: "marker-bot", w: 68, x: 0, side: "c", yar: true, shirt: YAR_SHIRT })}</div>
      </div>

      ${pillsHtml}

      <div class="card">
        ${cardsHtml}
        <div class="floor"></div>
      </div>

      ${capsHtml}

      ${clip("cta", CTA_AT, TOTAL - CTA_AT, "cta", `<div class="cta-chip" id="cta-chip">${avcTile()}${esc(spec.cta)}</div>`, 2)}
      ${clip("confetti", CTA_AT, TOTAL - CTA_AT, "confetti", confettiHtml, 2, " data-layout-ignore")}
      <div class="handle">@${spec.handle}</div>
      ${audioHtml}
    </div>

    <script id="data" type="application/json">${JSON.stringify(data)}</script>
    <script>
      const D = JSON.parse(document.getElementById("data").textContent);
      const tl = gsap.timeline({ paused: true });
      const C = D.cues;
      const reps = (span, cycle) => Math.max(0, Math.floor(span / cycle) - 1);
      const pop = (sel, t, dur = 0.5, from = {}) =>
        tl.fromTo(sel, { scale: 0, ...from }, { scale: 1, x: 0, duration: dur, ease: "power3.out" }, t);
      const wiggle = (sel, t) => tl.fromTo(sel, { rotation: -3 }, { rotation: 3, duration: 0.18, ease: "sine.inOut", yoyo: true, repeat: 3 }, t);
      const flashHl = (sel, t) => {
        tl.fromTo(sel, { scale: 1.25, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.28, ease: "power3.out" }, t);
        tl.fromTo(sel, { scale: 1 }, { scale: 1.03, duration: 0.3, yoyo: true, repeat: 3, ease: "sine.inOut" }, t + 0.28);
      };

      // ── bots ──
      function walkIn(id, t, span, { from = 0.9, delay = 0 } = {}) {
        const el = document.getElementById(id);
        if (!el) return;
        const side = el.dataset.side;
        const dx = side === "l" ? -720 : side === "r" ? 720 : 0;
        const t0 = t + delay;
        const steps = Math.max(1, Math.round(from / 0.14) - 1);
        if (dx) {
          tl.fromTo(el, { x: dx }, { x: 0, duration: from, ease: "power2.out" }, t0);
          tl.fromTo(el.querySelector(".bot-leg.l"), { rotation: -22 }, { rotation: 22, duration: 0.14, yoyo: true, repeat: steps, ease: "sine.inOut" }, t0);
          tl.fromTo(el.querySelector(".bot-leg.r"), { rotation: 22 }, { rotation: -22, duration: 0.14, yoyo: true, repeat: steps, ease: "sine.inOut" }, t0);
          tl.fromTo(el.querySelector(".bot-arm.l"), { rotation: 18 }, { rotation: -18, duration: 0.14, yoyo: true, repeat: steps, ease: "sine.inOut" }, t0);
          tl.fromTo(el.querySelector(".bot-arm.r"), { rotation: -18 }, { rotation: 18, duration: 0.14, yoyo: true, repeat: steps, ease: "sine.inOut" }, t0);
          tl.fromTo(el.querySelector(".bot-rig"), { y: 0 }, { y: -6, duration: 0.14, yoyo: true, repeat: steps, ease: "sine.inOut" }, t0);
        } else {
          tl.fromTo(el, { scale: 0, y: 40 }, { scale: 1, y: 0, duration: 0.5, ease: "power3.out" }, t0);
        }
        const seed = (parseFloat(el.style.left) || 0) / 1000;
        const idleStart = t0 + from + 0.05;
        const left = span - (idleStart - t);
        if (left > 1.2) {
          tl.fromTo(el.querySelector(".bot-rig"), { scaleY: 1 }, { scaleY: 1.04, duration: 0.55 + seed * 0.3, yoyo: true, repeat: reps(left, 0.55 + seed * 0.3), ease: "sine.inOut" }, idleStart);
          tl.fromTo(el.querySelector(".bot-head"), { rotation: -3 + seed * 4 }, { rotation: 3 - seed * 4, duration: 0.9 + seed, yoyo: true, repeat: reps(left, 0.9 + seed), ease: "sine.inOut" }, idleStart);
        }
      }
      function jump(id, t, h = 90) {
        const el = document.getElementById(id);
        if (!el) return;
        tl.fromTo(el.querySelector(".bot-rig"), { y: 0 }, { y: -h, duration: 0.28, ease: "power2.out", yoyo: true, repeat: 1 }, t);
        tl.fromTo(el.querySelector(".bot-arm.l"), { rotation: 0 }, { rotation: 150, duration: 0.22, ease: "power2.out", yoyo: true, repeat: 1 }, t);
        tl.fromTo(el.querySelector(".bot-arm.r"), { rotation: 0 }, { rotation: -150, duration: 0.22, ease: "power2.out", yoyo: true, repeat: 1 }, t);
      }
      function pointUp(id, t, arm = "r", hold = 1.2) {
        const el = document.getElementById(id);
        if (!el) return;
        const a = el.querySelector(".bot-arm." + arm);
        tl.to(a, { rotation: arm === "r" ? -150 : 150, duration: 0.3, ease: "back.out(1.4)" }, t);
        tl.to(a, { rotation: 0, duration: 0.3, ease: "power2.inOut" }, t + hold);
      }
      function shrug(id, t) {
        const el = document.getElementById(id);
        if (!el) return;
        tl.fromTo(el.querySelectorAll(".bot-arm"), { rotation: 0 }, { rotation: (i) => (i ? -70 : 70), duration: 0.25, ease: "back.out(1.6)", yoyo: true, repeat: 1, repeatDelay: 0.5 }, t);
        tl.fromTo(el.querySelector(".bot-head"), { rotation: 0 }, { rotation: -10, duration: 0.25, yoyo: true, repeat: 1, repeatDelay: 0.5 }, t);
      }
      const crowd = (i) => Array.from(document.querySelectorAll("#beat-" + i + " .bot:not(.bot-yar)")).map((e) => e.id);
      D.beats.forEach((b) => crowd(b.i).forEach((id, j) => walkIn(id, b.start, b.end - b.start, { from: 0.8 + (j % 3) * 0.18, delay: 0.05 + j * 0.09 })));

      // ── ambient ──
      tl.fromTo("#blob1", { x: 0, y: 0, scale: 1 }, { x: -60, y: -40, scale: 1.12, duration: D.total / 2, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0);
      tl.fromTo("#blob2", { x: 0, y: 0 }, { x: 50, y: 30, duration: D.total / 3, yoyo: true, repeat: 2, ease: "sine.inOut" }, 0);
      tl.fromTo("#ghostavc", { rotation: -8 }, { rotation: 8, duration: 2.4, yoyo: true, repeat: reps(D.total, 2.4), ease: "sine.inOut" }, 0);
      tl.fromTo("#marker-bot .bot-rig", { scaleY: 1 }, { scaleY: 1.05, duration: 0.5, yoyo: true, repeat: reps(D.total, 0.5), ease: "sine.inOut" }, 0);
      tl.fromTo("#marker-bot .bot-head", { rotation: -4 }, { rotation: 4, duration: 1.1, yoyo: true, repeat: reps(D.total, 1.1), ease: "sine.inOut" }, 0);

      // ── rail ──
      const railW = D.rail.x1 - D.rail.x0;
      tl.set("#rail-fill", { scaleX: (D.stops[0] - D.rail.x0) / railW }, 0);
      const hopTo = (x, t) => {
        tl.to("#marker", { x, duration: 0.55, ease: "power2.inOut" }, t);
        tl.to("#marker", { y: -46, duration: 0.27, ease: "power2.out", yoyo: true, repeat: 1 }, t);
        tl.fromTo("#marker-bot .bot-leg.l", { rotation: 0 }, { rotation: -35, duration: 0.27, yoyo: true, repeat: 1, ease: "power2.out" }, t);
        tl.fromTo("#marker-bot .bot-leg.r", { rotation: 0 }, { rotation: 35, duration: 0.27, yoyo: true, repeat: 1, ease: "power2.out" }, t);
      };
      const tick = (stop, t) => {
        tl.to(stop, { backgroundColor: "${INK}", borderColor: "${INK}", duration: 0.25 }, t);
        tl.to(stop.querySelector(".stop-num"), { opacity: 0, duration: 0.15 }, t);
        tl.to(stop.querySelector(".stop-check"), { opacity: 1, duration: 0.2 }, t + 0.1);
        tl.fromTo(stop, { scale: 1 }, { scale: 1.3, duration: 0.15, yoyo: true, repeat: 1, ease: "power2.out" }, t);
      };
      const stops = document.querySelectorAll(".stop");
      D.beats.forEach((b, i) => {
        if (i === 0) return;
        tl.to("#rail-fill", { scaleX: (D.stops[i] - D.rail.x0) / railW, duration: 0.55, ease: "power3.inOut" }, b.start);
        hopTo(D.stops[i] - D.stops[0], b.start);
        tick(stops[i - 1], b.start + 0.1);
      });
      const last = D.beats[5], lastEnd = last.start + last.dur;
      tl.to("#rail-fill", { scaleX: 1, duration: 0.55, ease: "power3.inOut" }, lastEnd - 0.4);
      hopTo(D.flagX - D.stops[0], lastEnd - 0.4);
      tick(stops[5], lastEnd - 0.3);
      tl.fromTo("#flag", { scale: 1, rotation: 0 }, { scale: 1.4, rotation: 20, duration: 0.25, ease: "power2.out" }, lastEnd + 0.1);
      tl.to("#flag", { scale: 1, rotation: 0, duration: 0.4, ease: "power3.out" }, lastEnd + 0.35);

      // ── pill swaps ──
      D.beats.forEach((b) => {
        tl.fromTo("#pill-in-" + b.i, { scale: b.i === 1 ? 0.96 : 0.8, opacity: b.i === 1 ? 1 : 0, y: b.i === 1 ? 0 : 18, rotation: b.i === 1 ? 0 : (b.i % 2 ? -3 : 3) },
          { scale: 1, opacity: 1, y: 0, rotation: 0, duration: 0.45, ease: "power3.out" }, b.start);
        if (b.i > 1) tl.fromTo("#pill-in-" + b.i + " .pill-l2 span", { scaleX: 0.2 }, { scaleX: 1, duration: 0.4, ease: "power3.out", transformOrigin: "0% 50%" }, b.start + 0.15);
        tl.fromTo("#pill-in-" + b.i, { y: 0 }, { y: -6, duration: 0.7, yoyo: true, repeat: reps(b.end - b.start - 0.5, 0.7), ease: "sine.inOut" }, b.start + 0.5);
      });

      // ── card scene transitions ──
      D.beats.forEach((b) => {
        if (b.i > 1) tl.fromTo("#inner-" + b.i, { x: 260, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: "power3.out" }, b.start);
        if (b.i < 6) tl.to("#inner-" + b.i, { x: -200, opacity: 0, duration: 0.3, ease: "power2.in" }, b.end - 0.3);
      });

      // ── captions ──
      D.caps.forEach((w) => tl.fromTo("#" + w.id, { opacity: 0, scale: 1.35, y: 6 }, { opacity: 1, scale: 1, y: 0, duration: 0.18, ease: "power3.out" }, w.at));

      // ── beat 1 ──
      const b1 = D.beats[0];
      tl.fromTo("#b1shot img", { scale: 1.02 }, { scale: 1.16, duration: b1.dur, ease: "none" }, b1.start);
      tl.fromTo("#b1shot", { rotation: -1.5 }, { rotation: 1.5, duration: 1.4, yoyo: true, repeat: reps(b1.dur, 1.4), ease: "sine.inOut" }, b1.start);
      tl.fromTo("#b1url", { x: -40 }, { x: 0, duration: 0.5, ease: "power3.out" }, b1.start);
      wiggle("#b1url", C.b1_studio);
      tl.fromTo("#b1-yar .bot-rig", { scaleY: 1 }, { scaleY: 1.05, duration: 0.5, yoyo: true, repeat: reps(b1.dur, 0.5), ease: "sine.inOut" }, b1.start);
      jump("b1-yar", C.b1_studio, 100);
      crowd(1).forEach((id, j) => jump(id, C.b1_studio + 0.1 + j * 0.06, 60));
      pop("#b1prompt", C.b1_one - 0.1, 0.4, { rotation: -10 });
      tl.fromTo("#b1strike", { scaleX: 0 }, { scaleX: 1, duration: 0.3, ease: "power3.out" }, C.b1_hope);
      tl.fromTo("#b1prompt", { rotation: 0 }, { rotation: -6, duration: 0.12, yoyo: true, repeat: 3, ease: "sine.inOut" }, C.b1_hope + 0.3);
      shrug("b1-yar", C.b1_hope);

      // ── beat 2 ──
      const b2 = D.beats[1];
      tl.fromTo("#b2shot", { y: 40 }, { y: -30, duration: b2.dur, ease: "none" }, b2.start);
      pop("#b2url", b2.start + 0.35, 0.4); wiggle("#b2url", C.b2_flow);
      walkIn("b2-yar", b2.start, b2.dur, { from: 0.7, delay: 0.3 });
      [["#hl-vibe", "#b2c1", C.b2_vibe], ["#hl-hero", "#b2c2", C.b2_hero], ["#hl-style", "#b2c3", C.b2_style]].forEach(([hl, chip, t]) => {
        flashHl(hl, t); pop(chip, t, 0.4, { x: -40 });
      });
      pointUp("b2-yar", C.b2_vibe - 0.1, "r", C.b2_style - C.b2_vibe + 0.8);
      jump("b2-bot0", C.b2_style + 0.1, 70);

      // ── beat 3 ──
      const b3 = D.beats[2];
      tl.fromTo("#b3img", { y: 0 }, { y: -172, duration: b3.dur, ease: "none" }, b3.start);
      [["#b3c1", C.b3_characters], ["#b3c2", C.b3_camera], ["#b3c3", C.b3_dialogue]].forEach(([c, t]) => { pop(c, t, 0.4, { x: -40 }); wiggle(c, t + 0.4); });
      tl.fromTo("#b3stamp", { scale: 2.4, opacity: 0, rotation: -14 }, { scale: 1, opacity: 1, rotation: -5, duration: 0.34, ease: "power4.out" }, C.b3_zero);
      tl.fromTo("#b3stamp", { rotation: -5 }, { rotation: -1, duration: 0.5, yoyo: true, repeat: reps(b3.start + b3.dur - C.b3_zero - 0.4, 0.5), ease: "sine.inOut" }, C.b3_zero + 0.35);
      crowd(3).forEach((id, j) => jump(id, C.b3_zero + 0.15 + j * 0.08, 90));
      crowd(3).forEach((id, j) => jump(id, C.b3_fix + j * 0.08, 50));

      // ── beat 4 ──
      const b4 = D.beats[3];
      tl.fromTo("#b4board", { scale: 0.9, rotation: -3 }, { scale: 1, rotation: 0, duration: 0.6, ease: "power3.out" }, b4.start);
      tl.to("#b4flash", { opacity: 1, duration: 0.1 }, C.b4_generates);
      tl.set("#b4board", { opacity: 0 }, C.b4_generates + 0.1);
      tl.set("#b4clips", { opacity: 1 }, C.b4_generates + 0.1);
      tl.to("#b4flash", { opacity: 0, duration: 0.35, ease: "power2.out" }, C.b4_generates + 0.1);
      tl.fromTo("#b4clips", { scale: 1.08 }, { scale: 1, duration: 0.5, ease: "power3.out" }, C.b4_generates + 0.1);
      tl.fromTo("#b4clips img", { scale: 1, x: 0 }, { scale: 1.08, x: -20, duration: b4.start + b4.dur - C.b4_generates, ease: "none" }, C.b4_generates + 0.1);
      pop("#b4approve", b4.start + 0.5, 0.45, { rotation: 8 });
      pop("#b4c1", C.b4_six, 0.4); wiggle("#b4c1", C.b4_six + 0.4);
      flashHl("#hl-90", C.b4_ninety);
      pop("#b4c2", C.b4_ninety, 0.4); wiggle("#b4c2", C.b4_ninety + 0.4);
      crowd(4).forEach((id, j) => jump(id, C.b4_generates + 0.2 + j * 0.06, 80));
      crowd(4).forEach((id, j) => jump(id, C.b4_film + j * 0.06, 60));

      // ── beat 5 ──
      const b5 = D.beats[4];
      tl.fromTo("#b5chars", { scale: 0.92 }, { scale: 1, duration: 0.6, ease: "power3.out" }, b5.start);
      tl.to("#b5chars", { opacity: 0, scale: 0.9, duration: 0.25, ease: "power2.in" }, C.b5_at - 0.2);
      tl.fromTo("#b5silas", { opacity: 0, scale: 1.1 }, { opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" }, C.b5_at);
      tl.fromTo("#b5silas img", { x: 0 }, { x: -24, duration: b5.start + b5.dur - C.b5_at, ease: "none" }, C.b5_at);
      pop("#b5tag", C.b5_at + 0.1, 0.4, { rotation: -12 }); wiggle("#b5tag", C.b5_at + 0.5);
      pop("#b5same", C.b5_same, 0.4); wiggle("#b5same", C.b5_same + 0.4);
      tl.set("#b5-yar", { scale: 0 }, b5.start);
      tl.fromTo("#b5-yar", { scale: 0, y: 80 }, { scale: 1, y: 0, duration: 0.45, ease: "power3.out" }, C.b5_yourself - 0.2);
      jump("b5-yar", C.b5_yourself + 0.3, 110);
      pop("#b5you", C.b5_yourself + 0.1, 0.4, { rotation: 10 }); wiggle("#b5you", C.b5_yourself + 0.5);
      crowd(5).forEach((id, j) => jump(id, C.b5_yourself + 0.35 + j * 0.06, 70));

      // ── beat 6 ──
      const b6 = D.beats[5];
      tl.fromTo("#b6shot", { scale: 0.94, rotation: 2 }, { scale: 1, rotation: 0, duration: 0.6, ease: "power3.out" }, b6.start);
      tl.fromTo("#playhead", { x: 0 }, { x: 640, duration: b6.dur, ease: "none" }, b6.start);
      walkIn("b6-yar", b6.start, b6.dur, { from: 0.5, delay: 0.4 });
      pop("#b6c1", C.b6_trim, 0.4, { rotation: -10 }); wiggle("#b6c1", C.b6_trim + 0.4);
      pop("#b6c2", C.b6_export, 0.4, { rotation: 10 }); wiggle("#b6c2", C.b6_export + 0.4);
      tl.fromTo("#b6c2", { y: 0 }, { y: 10, duration: 0.25, yoyo: true, repeat: 5, ease: "sine.inOut" }, C.b6_export + 0.5);
      jump("b6-yar", C.b6_save, 110);
      crowd(6).forEach((id, j) => jump(id, C.b6_save + 0.1 + j * 0.07, 70));
      jump("b6-yar", C.cta + 0.2, 100);
      tl.fromTo("#cta-chip", { scale: 0.7, opacity: 0, y: 20 }, { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, C.cta);
      tl.fromTo("#cta-chip", { y: 0 }, { y: -6, duration: 0.5, yoyo: true, repeat: reps(D.total - C.cta - 0.5, 0.5), ease: "sine.inOut" }, C.cta + 0.5);
      gsap.utils.toArray(".cf").forEach((p, i) => {
        const a = (i * 0.83) % (Math.PI * 2), r = 260 + (i * 37) % 220;
        tl.fromTo(p, { x: 0, y: 0, opacity: 0, rotation: 0, scale: 0.6 }, { x: Math.cos(a) * r, y: -Math.abs(Math.sin(a)) * r - 120, opacity: 1, rotation: 180 + i * 37, scale: 1, duration: 0.6, ease: "power2.out" }, C.cta + 0.15 + (i % 5) * 0.02);
        tl.to(p, { y: "+=420", rotation: "+=180", duration: 1.4, ease: "power1.in" }, C.cta + 0.75 + (i % 5) * 0.02);
        tl.to(p, { opacity: 0, duration: 0.4 }, C.cta + 1.75);
      });
      tl.to({}, { duration: 0.01 }, D.total - 0.01);

      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
writeFileSync(resolve(root, "index.html"), html);
console.log(`index.html: ${beats.length} beats, ${chunks.length} caption chunks, ${TOTAL}s, bgm ${bgmDur}s`);
