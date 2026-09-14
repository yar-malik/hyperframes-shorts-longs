# How this hook was edited

## 1. Start with immediate movement

The raw talking-head footage stays full-screen for the first three seconds with a slow push-in, so the viewer connects with the speaker first. At 0.06 seconds, the `GPT-6 ASTRA` title slams in and holds until 2.55 seconds; the opening words get a large centered caption.

At 3 seconds, the footage shrinks into its floating card over 0.75 seconds (`power4.inOut`) while the canvas window scales in behind it.

## 2. Float the presenter on the right

The final layout is a 340×560 rounded card at `left: 1520px; top: 260px`, next to the canvas window. The footage is not permanently cropped: HyperFrames animates a rounded `clip-path` inset and the camera wrapper, so teammates can change the card size or framing directly in CSS and GSAP. If you move the card, update the `clipPath` inset, the camera `x`/`y`/`scale`, `.pip-frame`, and `.presenter-tag` together.

Key selectors:

- `#presenter-clip` controls the visible card (rounded clip-path).
- `#pip-frame` draws the card's orange offset shadow.
- `#presenter-camera` controls the crop position and zoom.
- `#presenter-video` is the untouched raw source.

## 3. Let visuals carry the explanation

The left canvas follows four spoken beats:

1. `0.00–5.28` — GPT-6 Astra presented as a motion-design engine.
2. `5.28–8.06` — an “unlock the workflow” sequence.
3. `8.06–12.37` — text prompt, website URL, and reference image enter as three inputs.
4. `12.37–16.25` — those inputs resolve into a wall of motion outputs.

This is the reusable lesson: keep the speaker as an anchor, but give most of the frame to visual evidence that changes with the sentence.

## 4. Sync captions to the original voice

`transcript.json` contains word-level timings. The same timings are embedded in `index.html` so the composition remains deterministic and does not fetch anything during rendering. One seek-safe timeline driver highlights the active word.

## 5. Change it for another hook

Replace the source video, update the four beat ranges and captions, then redesign each scene around the new topic. Run `npm run check` after every structural change and use the Studio timeline to inspect the crop and animation before rendering.
