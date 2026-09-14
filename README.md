# Google Flow Short — HyperFrames example

One complete, editable vertical short built with [HyperFrames](https://hyperframes.heygen.com/).
Use this repository as the team reference for how a finished short is structured, checked, previewed, and rendered.

![Composition contact sheet](docs/contact-sheet.jpg)

## Watch and study the example

- **Published Short:** [The secret to creating AI movies in minutes](https://www.youtube.com/shorts/_YGFZe2RKVo)
- **Local preview:** [`demo/google-flow-short-preview.mp4`](demo/google-flow-short-preview.mp4)
- **Editing inspiration:** [Alex / nocodealex — “Own a full AI agency for $0”](https://www.instagram.com/nocodealex/reel/Dc4cu6cySSA/)
- **Style notes:** [`EDITING_REFERENCE.md`](EDITING_REFERENCE.md) explains which editing patterns informed this example.

The Instagram reel is an editing reference only. It inspired the layout, pacing, progress rail, headline card, rounded visual stage, and word-by-word captions. It is not the factual source for the Google Flow script.

## Start here

Requirements: Node.js 22+, npm, FFmpeg, and Chrome.

```bash
git clone https://github.com/yar-malik/hyperframes-google-flow-short.git
cd hyperframes-google-flow-short
npm install
npm run check
npm run dev
```

The Studio preview opens the composition with a seekable timeline. Stop it with `Ctrl+C` when finished.

## What to edit

- `script.json` — the six spoken lines, project message, published link, and editing reference.
- `index.html` — the complete 1080×1920 composition: layout, styling, clips, captions, and GSAP timelines.
- `public/broll/` — screenshots shown inside the animated cards.
- `public/sfx/` and `public/bgm.wav` — sound effects and music.
- `.media/audio/voice/` — one voiceover file per beat.
- `audio_meta.json` — word-level voice timing used for karaoke captions and animation cues.
- `scripts/build.mjs` — rebuilds `index.html` from the script and timing files. It overwrites `index.html`, so commit first.

The six numbered beats in `scripts/build.mjs` are the easiest map of the video. Each beat defines its duration, headline pill, visual card, animation, voice track, and caption timing.

## Safe editing loop

```bash
# 1. Edit the composition or replace media.

# 2. Run the full HyperFrames gate.
npm run check

# 3. Review the seekable timeline.
npm run dev

# 4. Render after the preview looks right.
npm run render -- --quality high --output renders/my-short.mp4
```

Always fix check errors before rendering. Review warnings instead of ignoring them automatically.

The included composition currently passes the full HyperFrames check with zero errors. It retains a few reviewed warnings from the original production project: the deliberately cropped screenshots, repeated portrait asset, dense single-file timeline, direct voiceover carve list, and a 13 ms overlap between two adjacent voice files. They do not block rendering, but they are useful refactoring exercises when learning the project.

## Re-record the script (optional)

The repository already includes the finished voice tracks, so this is only needed after changing the spoken copy.

1. Copy `.env.example` to `.env.local` and add your ElevenLabs key and voice ID.
2. Edit `script.json`.
3. Run:

```bash
node scripts/tts.mjs
node scripts/build.mjs
npm run check
```

The TTS script writes new audio and word timings. The build script then regenerates the composition and captions from those timings.

## Project anatomy

```text
.
├── index.html                 # main HyperFrames composition
├── script.json               # spoken copy
├── audio_meta.json           # word timings for captions/cues
├── hyperframes.json          # HyperFrames project config
├── scripts/
│   ├── build.mjs             # regenerates index.html
│   └── tts.mjs               # optional ElevenLabs voice generation
├── public/                    # B-roll, portrait, music, SFX, font, logo
├── .media/audio/voice/       # rendered voice beats
├── demo/                     # small finished reference render
├── docs/contact-sheet.jpg    # visual overview of the beats
└── EDITING_REFERENCE.md      # original editing inspiration and style notes
```

## Before sharing publicly

This is an internal teaching example. Replace the included portrait, voice, Google Flow screenshots, and music/SFX with assets you have permission to publish before making a derivative repository or video public.
