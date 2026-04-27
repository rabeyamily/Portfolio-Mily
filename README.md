# Portfolio-Mily

Personal portfolio site for **Rabeya Mily**, built with vanilla HTML, CSS, and JavaScript—no framework and no build step.

## Overview

A fully static, responsive portfolio that includes:

- Landing hero with animated background, “PORTFOLIO” headline, and portrait
- About with profile, interest tags, and info cards
- **Projects** with two tabs: **Interactive Media** and **CS & HCI**; expandable grids on small screens
- **Skills & experiences** timeline with expand/collapse
- **Creative** gallery (photos and videos), filters, preview limits, and a shared lightbox
- **Contact** with Formspree and CV download / “View online”

## Tech stack

- HTML5
- CSS3 (custom properties, responsive layout, animations)
- Vanilla JavaScript (DOM, fetch, observers, modals)
- [Formspree](https://formspree.io/) for the contact form

## Key features

- Responsive nav and mobile drawer; optional custom cursor on desktop
- Hero: particles, decorative assets, scroll hint, safe parallax on larger viewports
- Projects: tabbed panels, project cards with links, mobile “View more” where used
- CV: **Download** loads the PDF with `fetch`, then saves as `rabeya-cv.pdf` via a blob; **View online** opens an in-page modal with the same PDF embedded. Use **http(s)** locally so download works (see below).
- Creative: interleaved photo/video grid, Instagram-style cards, lightbox carousel
- Contact: async submit, success/error feedback

## Project structure

```text
Portfolio-Mily/
├── index.html          # Single page: sections, CV modal, creative lightbox
├── style.css           # Global and component styles
├── script.js           # Navigation, projects, creative, CV, form, hero behavior
├── assets/             # Images, videos, project thumbnails, hero assets
└── cv/                 # Resume PDF (see configuration)
```

## Getting started

### Clone and run locally

```bash
git clone https://github.com/rabeyamily/Portfolio-Mily.git
cd Portfolio-Mily
```

### Serve over HTTP (recommended)

Opening `index.html` as a `file://` URL can break **PDF fetch** (CV download), **some video behavior**, and **Formspree**. Use a local server:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

## Configuration

### Contact form

The form posts to Formspree. In `script.js`, set:

- `FORMSPREE_ENDPOINT`

Change it if you create a new Formspree form.

### Creative gallery

Media lists and base paths live in `script.js`:

- `CREATIVE_PHOTO_FILES` — files under `assets/photos/`
- `CREATIVE_VIDEO_FILES` — files under `assets/Videos/`

Add or remove entries to match files on disk (`PHOTO_BASE` / `VIDEO_BASE` are defined next to those lists).

### CV

| Item | Location |
|------|----------|
| PDF file on disk | `cv/Mily_s_Resume__SWE_.pdf` |
| Download filename | `rabeya-cv.pdf` (set in `script.js`: `CV_DOWNLOAD_FILENAME`, `CV_SOURCE_PATH`) |
| HTML references | `index.html`: nav, mobile menu, contact, CV modal `href` / iframe `src` |

If you rename or move the PDF, update `CV_SOURCE_PATH` in `script.js` and all `cv/...` links and the modal iframe `src` in `index.html`.

## Deployment

Works on any static host (GitHub Pages, Vercel, Netlify, Cloudflare Pages, etc.):

- **Build command:** none  
- **Publish directory:** repository root (same layout as locally)

Ensure the `cv/` folder and PDF are deployed so download and the modal continue to work.

## Accessibility and UX

- Semantic sections and landmark-style structure
- `Escape` closes the CV modal and the creative lightbox where applicable
- Form submission states and responsive layout across common breakpoints
