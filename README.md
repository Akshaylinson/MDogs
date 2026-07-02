# Personal Media Archive

A premium, single-user media archive built with plain HTML, Tailwind CSS via CDN, vanilla ES modules, and IndexedDB.

It runs entirely in the browser with no backend, no build step, and no npm dependencies.

## Overview

This app is designed for personal research and archival use. You can organize images and videos into manual categories, tag media, mark favorites, search instantly, and view everything in a polished fullscreen experience.

All data is stored locally in IndexedDB, so the app works offline after the first load.

## Pages

- `index.html` - dashboard and category management
- `category.html?id=<category-id>` - category detail, upload, gallery, and viewer
- `favorites.html` - favorite media collection
- `settings.html` - theme, gallery, slideshow, and storage settings

## Features

- Create, rename, and delete categories
- Upload images and videos
- Drag-and-drop upload support
- Local tags with autocomplete-style suggestions
- Favorite toggle for media items
- Search categories and media instantly
- Masonry-style responsive gallery
- Fullscreen media viewer with keyboard support
- Slideshow mode
- Light, dark, and system theme support
- Export and import metadata as JSON
- Storage statistics and data clearing tools

## Technology

- HTML5
- Tailwind CSS CDN
- Vanilla JavaScript ES modules
- IndexedDB

## File Structure

```text
/
index.html
category.html
favorites.html
settings.html
/css
  styles.css
/js
  app.js
  db.js
  dashboard.js
  categories.js
  gallery.js
  upload.js
  viewer.js
  slideshow.js
  search.js
  favorites.js
  tags.js
  settings.js
  theme.js
  notifications.js
  helpers.js
/assets
  icons/
  placeholders/
```

## IndexedDB Stores

The app uses a database named `PersonalMediaArchiveDB` with these stores:

- `categories`
- `media`
- `tags`
- `settings`

Media blobs and generated thumbnails are stored locally in the browser.

## Running the Project

Just open `index.html` in a modern browser.

No install step is required.

## GitHub Pages

The project can be deployed directly to GitHub Pages because it is fully frontend-only.

## Notes

- Media and metadata stay local to the browser profile.
- Clearing browser storage or IndexedDB will remove the archive data.
- The design is optimized for a premium mobile-app feel with glass surfaces, rounded cards, and consistent media frames.
