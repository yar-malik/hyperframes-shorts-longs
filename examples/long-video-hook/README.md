# Long-video hook — HyperFrames edit example

This example shows how to turn a raw talking-head hook into a designed 16:9 opening for a longer video.

![Four key frames from the finished hook composition](docs/contact-sheet.jpg)

## Source

- **Raw hook:** [Google Drive](https://drive.google.com/file/d/1C4yEdXUr6sSTA79I0i7gM4Sp5X937NXD/view?usp=sharing)
- **Local source file:** [`source/gpt-6-astra-raw-hook.mp4`](source/gpt-6-astra-raw-hook.mp4)
- **Word timings:** [`transcript.json`](transcript.json)

The raw footage is 17.94 seconds. The edit uses the spoken section through 16.25 seconds and removes the trailing pause.

## Editing idea

The presenter begins full-screen so the first word has human impact. Within the first second, the frame rapidly restructures:

- Yar moves into a narrow right-side rail occupying 20% of the screen.
- The left 80% becomes the main visual canvas.
- The canvas changes with the narration: Astra engine → workflow → three inputs → motion outputs.
- Word-level captions follow the supplied voice timing.
- The source video remains intact; the crop, timing, canvas, and motion are all editable in `index.html`.

Read [`EDIT_WALKTHROUGH.md`](EDIT_WALKTHROUGH.md) for the beat-by-beat implementation.

## Preview and edit

```bash
npm install
npm run check:hook
npm run dev:hook
```

Open `index.html` to change the layout, timing, copy, crop, or animation. HyperFrames owns video and audio playback, so keep the visual `<video>` muted and use the separate `<audio>` element for sound.
