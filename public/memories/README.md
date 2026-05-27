# Memory media

Place seed assets in this folder. Paths in `src/data/memories.js` resolve to `/memories/<filename>` (with Vite `BASE_URL` when deployed under a subpath).

## Required seed files (case-sensitive)

| File | Memory |
|------|--------|
| `childhood.jpg` | childhood light |
| `2birthday.jpg` | second birthday |
| `summerhome.jpg` | summer home |
| `bluehour.jpg` | blue hour |
| `sunshineclassroom.MOV` | sunshine classroom |
| `DaliwithLeni.MOV` | dali with leni |

If a file is missing, the dev server returns **404** (not the SPA shell), and the UI shows a soft “signal lost” placeholder instead of a broken image icon.

## Video performance

For smoother playback, prefer **720p or lower** MP4 (H.264) instead of large `.MOV` originals:

```bash
ffmpeg -i sunshineclassroom.MOV -vf "scale=-2:720" -c:v libx264 -crf 23 -c:a aac -movflags +faststart sunshineclassroom.mp4
```

Update `filePath` in `src/data/memories.js` after converting.
