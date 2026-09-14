# Carousel prompt pack

These prompts are the reusable method behind this case study. They are written so a teammate can replace the topic, brand, and portrait without copying the referenced creator's words or exact artwork.

The precise historical prompt used for the published post was not preserved. The master prompt below is a reconstruction from the final files and documented workflow; it is the recommended starting point, not a verbatim archive.

## Inputs to prepare

- Topic, audience, and the one outcome the reader should remember.
- A source or research note for factual claims.
- A brand sheet: colours, type direction, handle, and footer text.
- A square or portrait photograph that you have permission to publish.
- One or more creative references. Use them for structure and mood, not copied copy, illustrations, or exact layouts.
- Desired slide count. Default to 7–8 for Instagram unless the subject genuinely needs more.

## Master creation prompt

```text
Create a complete Instagram carousel for [ACCOUNT / BRAND] about [TOPIC].

Audience: [WHO IT IS FOR]
Outcome: after swiping, the reader should understand [ONE OUTCOME].
Primary action: [SAVE / COMMENT A KEYWORD / VISIT LINK / FOLLOW].
Canvas: 1080 × 1350 px (4:5), with at least 50 px safe margin.
Length: [7 OR 8] slides.

Use these factual inputs:
[PASTE SOURCE NOTES AND LINKS]

Use these creative references only to study editorial rhythm, hierarchy,
contrast, and pacing:
[PASTE REFERENCE LINKS]

Do not copy their wording, images, illustrations, or exact composition.
Create an original visual system for this brand.

Brand direction:
- palette: [HEX VALUES AND ROLES]
- typography: [DISPLAY / BODY DIRECTION]
- recurring label: [SERIES NAME]
- handle/footer: [TEXT]
- portrait: [LOCAL FILE], used only where it supports the story

Narrative:
1. Cover: a short, specific hook that survives as a small grid thumbnail.
2. Problem: make the reader recognize the failure or cost.
3–5. Teaching: one nameable idea per slide, with a visual explanation.
6. Principle or proof: explain why the method works.
7. Operating loop/checklist: make the process repeatable.
8. Takeaway: recap the value and give a specific reason to save or respond.

Visual rules:
- One dominant idea and one dominant visual per slide.
- Use large editorial headlines and short supporting copy.
- Alternate light and dark scenes to create swipe rhythm.
- Ration the accent colour to the most important phrase.
- Use the portrait on 2–3 slides, not as decoration on every slide.
- Prefer diagrams, annotations, paper texture, tape, grain, and irregular
  composition over a repeated grid of generic dashboard cards.
- Keep body text at least 27 px and verify contrast.
- No text may cross the safe area or be clipped.

Deliver:
1. A slide-by-slide content outline for approval.
2. Editable source for every slide.
3. Numbered PNG exports in upload order.
4. A contact sheet showing the whole sequence.
5. A short caption that adds context instead of narrating every slide.
6. A REFERENCES file listing factual sources, creative references, and asset rights.

Before finishing, review the entire sequence at thumbnail size and every
slide at full size. Report any claim without a source, any low-contrast text,
awkward wrapping, clipped content, repeated composition, or weak final CTA.
```

## Prompt for a reference-image workflow

Use this when the starting point is a screenshot such as the DeepSeek carousel in the vault:

```text
Study the attached carousel as creative direction. First describe its
transferable system: canvas ratio, headline scale, palette roles, texture,
portrait treatment, diagram language, footer device, and swipe rhythm.

Then design an original carousel for [TOPIC] using my supplied portrait and
brand details. Preserve the energy and hierarchy, but do not reproduce the
reference's wording, imagery, or exact slide layouts. Give each slide a
different composition while keeping a consistent masthead and footer.

Return the outline before rendering. After approval, export editable source,
numbered 1080×1350 PNGs, a contact sheet, caption, and reference/rights notes.
```

## Three independent review prompts

Run these in fresh contexts after the first render. Give each critic only the brief, relevant rules, and rendered outputs.

### Brief critic

```text
Compare this carousel with the brief. Make a table of every requested outcome
and mark it PASS, MISSING, or PARTIAL. Quote the exact slide evidence. Return
only gaps and precise corrections; do not redesign the carousel.
```

### Design-system critic

```text
Audit these slides against the supplied design system. Check colour tokens,
typography, minimum sizes, spacing, safe areas, recurring masthead/footer,
portrait usage, and consistency across the sequence. List every violation by
slide, severity, and exact correction. Do not introduce a new visual style.
```

### Render critic

```text
Inspect the rendered pixels, not the source code. Review the contact sheet and
every full-size slide for hierarchy, contrast, wrapping, clipping, collisions,
unintended crops, repetitive composition, and thumbnail readability. Return a
ranked punch list with slide number and concrete fix. Approve only when every
critical issue passes.
```

## Recommended stop rule

Patch the failed checks and rerun the critics. Stop when all critical checks pass or after three review rounds, then make a human publishing decision.
