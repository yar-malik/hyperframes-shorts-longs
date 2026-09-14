# Instagram carousel: Claude's three-critic review loop

This folder contains the complete, reproducible process used to create and publish Yar Malik's eight-slide Instagram carousel about improving Claude output with independent review agents.

![Eight-slide carousel preview](output/carousel-preview.png)

## Live result and reference

- **Published carousel:** [@yar.claudecodex.mastery — Claude's three-critic loop](https://www.instagram.com/yar.claudecodex.mastery/p/DdDeqT8DlzZ/)
- **Creative reference:** [Jack Roberts — “Steal the loop that 10X'd Claude Design”](https://www.instagram.com/p/DdDJAbFFazu/)
- **Reference notes and attribution:** [`REFERENCES.md`](REFERENCES.md)

The reference informed the editorial rhythm: a strong hook, large black/orange type, alternating paper and dark slides, one idea per page, and image-led moments. The copy, diagrams, styling, and composition in this example are original and adapted to Yar's CCM Field Notes brand.

## What is included

```text
instagram-carousel/
├── README.md
├── DESIGN.md
├── REFERENCES.md
├── caption.txt
├── assets/
│   └── yar-avatar.jpg
├── output/
│   ├── carousel-preview.png
│   ├── slide-01.png ... slide-08.png
│   └── slide-01.svg ... slide-08.svg
└── scripts/
    └── build.mjs
```

- `scripts/build.mjs` is the editable source of truth.
- `assets/yar-avatar.jpg` personalizes the cover, failure-mode slide, and closing slide.
- `output/*.svg` are editable vector originals.
- `output/*.png` are upload-ready Instagram files at 1080×1350.
- `caption.txt` contains the exact published caption.
- `output/carousel-preview.png` is a contact sheet for quick review.

## Rebuild the carousel

Requirements: Node.js 22+ and npm.

From the repository root:

```bash
npm install
npm run build:carousel
```

The build script embeds the local avatar into each relevant SVG, renders all eight SVGs to PNG with Sharp, and regenerates the contact sheet and caption. It resolves its paths from the script file, so the command works regardless of the current directory.

## The production process

### 1. Read the reference for structure, not copy

Extract the transferable design decisions:

- A direct, contrarian hook on slide 1.
- A problem statement before the solution.
- One critic or concept per slide.
- Alternation between light editorial paper and dark technical panels.
- Orange as the attention colour and blue as the system colour.
- A clear operating loop and closing takeaway.

Do not reproduce the reference's copy, images, or exact layout. Use it as creative direction and write a new narrative for the account's audience.

### 2. Turn the topic into an eight-slide story

The sequence used here is:

| Slide | Purpose | Message |
| --- | --- | --- |
| 01 | Hook | Stop letting Claude grade its own work. |
| 02 | Problem | The builder and judge share the same blind spots. |
| 03 | Critic 1 | Check every requirement against the brief. |
| 04 | Critic 2 | Check colours, typography, spacing, and system rules. |
| 05 | Critic 3 | Inspect the rendered pixels, not only the code. |
| 06 | Principle | Give every critic a fresh context window. |
| 07 | Workflow | Build, score, patch, and repeat until the stop rule passes. |
| 08 | Takeaway | Use the loop where quality compounds. |

### 3. Make the account owner visible

The initial design felt generic because it relied too heavily on dashboard cards. The second version introduced Yar's real avatar as a recurring editorial device:

- Cover: small framed portrait inside the workflow panel.
- Slide 2: large portrait beside the “Looks good. Ship it.” speech bubble.
- Slide 8: strong circular portrait next to the three-check recap.

For another creator, replace `assets/yar-avatar.jpg` with a square portrait using the same filename, or update the asset path in `scripts/build.mjs`.

### 4. Use an editorial system, not an AI-dashboard template

The final system is intentionally tactile and human:

- Off-white paper, dots, grid lines, grain, tape, and slightly rotated sheets.
- Large editorial headlines with selective orange emphasis.
- Fewer rounded cards; cards appear only when they carry a meaningful diagram.
- Irregular composition from slide to slide instead of one repeated template.
- Hand-drawn circles, dashed arrows, notes, and check marks.
- Small CCM masthead and URL footer to hold the series together.

See [`DESIGN.md`](DESIGN.md) for the exact palette, sizing, and composition rules.

### 5. Review before upload

After rebuilding:

1. Open `output/carousel-preview.png` and inspect the story as a sequence.
2. Open every full-size PNG and confirm no text is clipped.
3. Verify each file is exactly 1080×1350.
4. Check slide order from `slide-01.png` through `slide-08.png`.
5. Read `caption.txt` aloud and remove anything that sounds generic or over-produced.
6. Confirm the avatar and any third-party reference material are permitted for publication.

### 6. Upload to Instagram

1. Open Instagram and choose **Create → Post**.
2. Select all eight PNG files in numerical order.
3. Keep the original 4:5 crop; do not zoom.
4. Continue without Instagram filters or colour adjustments.
5. Paste `caption.txt`.
6. Check the slide count, order, crop, account, caption, and cross-post settings.
7. Click **Share** only after the account owner gives final approval.
8. Wait for Instagram's “Your post has been shared” confirmation and verify it on the profile grid.

## Adapting this for a new topic

Keep the eight-slide narrative roles, then change:

- The hook, problem, three teaching points, operating loop, and final question.
- The portrait asset and account handle.
- The CCM masthead if the carousel belongs to another brand.
- Accent colours only if the new brand requires them.
- The caption and hashtags.

Prefer rewriting the `slides` array in `scripts/build.mjs` over editing generated SVG files directly. Rebuild afterward so the PNGs, SVGs, caption, and preview stay in sync.

## Rights and reuse

The generator and documentation follow the repository's MIT License. Yar Malik's portrait and likeness remain © Yar Malik and are included for internal teaching and reproduction by his authorized team. The linked Instagram reference remains the property of its creator and is not redistributed in this repository. See [`MEDIA_LICENSE.md`](../../MEDIA_LICENSE.md).
