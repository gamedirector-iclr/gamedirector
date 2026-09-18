# GameDirector

Standalone static project page for GameDirector. Everything required to serve the site is contained in this repository.

## Run locally

Node.js 18 or newer is required. No packages need to be installed.

```sh
npm start
```

The site is available at <http://localhost:8000>. To use another port:

```sh
npm start -- 8001
```

The preview server listens on all interfaces and supports byte-range requests for video playback and seeking.

## Project structure

- `index.html`: page markup and content
- `static/css/`: site styles
- `static/js/`: page interactions and media configuration
- `static/images/`: figures, icons, and character images
- `static/fonts/`: local web fonts
- `static/posters/`: video poster frames
- `static/videos/`: all video assets used by the page (mp4 + webm)
- `scripts/serve.mjs`: dependency-free local preview server

All browser-facing paths are relative to this project root, so the directory can be moved or copied without changing the site.
