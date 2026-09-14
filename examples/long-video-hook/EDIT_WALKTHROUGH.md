# How this hook was edited

## 1. Start with immediate movement

The raw talking-head footage begins full-screen. At 0.06 seconds, the `GPT-6 ASTRA` title slams in. At 0.18 seconds, the footage begins moving into its final rail while the visual canvas wipes on.

The move is intentionally fast: a short ramp, a linear burst, and a longer ease-out make the layout feel decisive without stopping harshly.

## 2. Put the presenter on the right

The final layout reserves 384 pixels of the 1920-pixel frame for the presenter—exactly 20%. The footage is not permanently cropped. HyperFrames animates the crop and camera wrapper, so teammates can change the split or framing directly in CSS and GSAP.

Key selectors:

- `#presenter-clip` controls the visible right-side rail.
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
