# Portfolio-Mily

Personal portfolio website for Rabeya Mily, built with vanilla HTML, CSS, and JavaScript.

## Overview

This project is a fully static, responsive portfolio site that showcases:
- academic background
- projects
- skills and experience
- creative photography and videography
- contact details with a working message form

The site is optimized for static hosting and does not require a build step.

## Tech Stack

- `HTML5`
- `CSS3` (custom properties, responsive layouts, animations)
- `Vanilla JavaScript` (UI behavior and interactions)
- `Formspree` (contact form submission endpoint)

## Key Features

- Responsive desktop/mobile navigation with hamburger menu
- Hero section with animated particle background and custom cursor
- Scroll reveal and animated counters
- CV modal with embedded PDF preview and download fallback
- Expand/collapse controls for Projects and Experience sections
- Creative gallery with:
  - photo/video filters
  - preview vs. view-all behavior
  - photo lightbox
  - inline video playback
- Contact form with async submission and user-friendly success/error states

## Project Structure

```text
Portfolio-Mily/
├── index.html          # Page structure and content
├── style.css           # Visual system, layout, component styles
├── script.js           # Interactions, animations, and form logic
├── assets/             # Images, videos, and project thumbnails
└── cv/                 # CV PDF and related files
```

## Getting Started

### 1) Clone the repository

```bash
git clone https://github.com/rabeyamily/Portfolio-Mily.git
cd Portfolio-Mily
```

### 2) Open locally

Because this is a static site, you can open `index.html` directly in a browser.

For best consistency, run a simple local server:

```bash
python3 -m http.server 8000
```

Then visit [http://localhost:8000](http://localhost:8000).

## Configuration Notes

### Contact Form

The contact form posts to Formspree in `script.js`:

- `FORMSPREE_ENDPOINT`

Update this value if you move to a different Formspree form.

### Creative Gallery Media

Media entries are defined in `script.js`:

- `CREATIVE_PHOTO_FILES`
- `CREATIVE_VIDEO_FILES`

Add/remove entries there to keep the gallery in sync with files in:
- `assets/photos`
- `assets/Videos`

### CV Modal

CV links and embedded preview reference:
- `cv/rabeya-cv.pdf`

If you rename the file, update references in `index.html`.

## Deployment

This project can be deployed to any static host:

- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages

No build command is required. Publish the repository root as static files.

## Accessibility and UX Notes

- Semantic sections and clear navigation structure
- Keyboard support for modal/lightbox close behavior (`Escape`)
- Visual feedback for form submission states
- Responsive layout across common viewport sizes


