# Build Prompt — Personal Media Archive Platform (Pure HTML + Tailwind + IndexedDB)

## Project Overview

Build a premium, single-user, frontend-only personal media archive application for organizing and managing images and videos under manually created categories.

The application is intended for personal research and archival purposes only.

The system must be completely frontend-based and run entirely inside the browser without any backend services.

The entire application must be deployable directly on GitHub Pages.

---

# Core Requirements

The application must allow a single administrator to:

* Create categories manually.
* Edit category names.
* Delete categories.
* Upload images and videos.
* Organize media using tags.
* Search categories and media instantly.
* Mark media as favorites.
* Browse media in responsive galleries.
* View media in fullscreen mode.
* Run slideshow mode.
* Persist all information locally inside the browser.

All application data must persist using IndexedDB.

---

# Mandatory Technology Stack

Use only:

## Frontend

* HTML5
* Tailwind CSS (via CDN only)
* Vanilla JavaScript (ES6 Modules)

## Browser Storage

* IndexedDB

Do not use:

* Node.js
* Express.js
* SQLite
* PHP
* MongoDB
* Firebase
* Supabase
* npm
* package.json
* Webpack
* Vite
* React
* Vue
* Angular
* jQuery
* Any server-side technology

No backend should exist.

No build process should exist.

Opening `index.html` in the browser or deploying to GitHub Pages must run the application.

---

# Application Architecture

The application must follow a modular architecture.

Generate the following structure.

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

README.md
```

Use ES6 imports and exports.

---

# IndexedDB Architecture

Create an IndexedDB database named:

```text
PersonalMediaArchiveDB
```

Database Version:

```text
1
```

Create the following object stores.

---

## Categories Store

Store Name:

```text
categories
```

Primary Key:

```text
id
```

Fields:

```text
id
name
slug
coverMediaId
createdAt
updatedAt
```

Indexes:

```text
name
slug
```

---

## Media Store

Store Name:

```text
media
```

Primary Key:

```text
id
```

Fields:

```text
id
categoryId
fileName
mediaType
mimeType
blobData
thumbnailBlob
fileSize
width
height
duration
tags
isFavorite
createdAt
updatedAt
```

Indexes:

```text
categoryId
mediaType
isFavorite
createdAt
```

Store uploaded files as Blob objects.

Generate optimized thumbnails automatically.

Store thumbnails separately.

---

## Tags Store

Store Name:

```text
tags
```

Fields:

```text
id
tagName
createdAt
```

---

## Settings Store

Store Name:

```text
settings
```

Fields:

```text
key
value
```

Examples:

```text
theme
galleryView
slideshowInterval
```

---

# Dashboard (Home Page)

The home page acts as the main dashboard.

Display all categories as premium responsive cards.

Each card must show:

* Cover image
* Category name
* Total image count
* Total video count
* Favorite count
* Date created

Card actions:

* Open category
* Rename category
* Delete category

---

# Dashboard Features

Provide:

### Add Category

Administrator can create new categories.

Example:

```text
Kareena Kapoor
Deepika Padukone
Samantha Ruth Prabhu
```

Automatically generate URL-safe slugs.

Example:

```text
Kareena Kapoor
```

becomes:

```text
kareena-kapoor
```

---

### Search Categories

Instant search while typing.

Search by:

* Category name

---

### Sorting

Allow:

* A-Z
* Z-A
* Newest First
* Oldest First

---

### View Modes

Allow:

* Grid View
* List View

Persist selected view.

---

# Category Detail Page

Route format:

```text
category.html?id=<category-id>
```

Load and display all media associated with that category.

Display:

* Category title
* Total media count
* Favorite count
* Search field
* Upload controls
* Filter controls

---

# Media Upload System

Support:

## Images

* JPG
* JPEG
* PNG
* WEBP
* GIF

## Videos

* MP4
* WEBM

---

# Upload Features

Implement:

* Single upload
* Multiple upload
* Bulk upload
* Drag and drop upload

Provide:

* Large drag-and-drop zone
* Preview before upload
* Upload progress indicators
* Remove file before upload
* Cancel upload
* File validation

Store all uploaded files in IndexedDB.

---

# Gallery System

Display uploaded media in a modern responsive masonry grid.

Requirements:

* Mobile responsive
* Masonry layout
* Lazy loading
* Infinite scrolling
* Skeleton loading placeholders

Each media card must display:

* Thumbnail
* Favorite icon
* Media type icon
* Upload date
* Tags

Hover actions:

* Preview
* Download
* Delete
* Edit tags
* Favorite toggle

---

# Search System

Provide instant search inside categories.

Search by:

* File name
* Tags

Results must update in real time.

Use debouncing for performance.

---

# Filter System

Allow filtering by:

* Images only
* Videos only
* Favorites only
* Recent uploads
* Oldest uploads
* Tags

---

# Favorites System

Allow any media item to be marked as favorite.

Features:

* Favorite toggle
* Dedicated favorites page
* Favorite filter
* Favorite count

Create:

```text
favorites.html
```

Favorite status must persist.

---

# Tagging System

Allow multiple tags per media.

Examples:

```text
Traditional
Casual
Movie
Event
Interview
Photoshoot
```

Features:

* Add tags
* Remove tags
* Edit tags
* Search by tags
* Filter by tags

Provide autocomplete suggestions from existing tags.

Persist all tags.

---

# Fullscreen Media Viewer

Clicking media opens a fullscreen modal viewer.

Features:

* Previous
* Next
* Download
* Delete
* Favorite toggle
* Edit tags
* Fullscreen support

For images:

* Zoom in
* Zoom out
* Pan support

For videos:

* Native playback controls

Keyboard shortcuts:

```text
Left Arrow  → Previous
Right Arrow → Next
Escape      → Close
F            → Favorite
Delete       → Delete media
```

---

# Slideshow Mode

Provide fullscreen slideshow mode.

Features:

* Auto play
* Pause
* Previous
* Next
* Keyboard controls
* Fullscreen mode
* Display filename
* Display tags

Allow slideshow intervals:

```text
3 seconds
5 seconds
10 seconds
30 seconds
```

Persist selected interval.

---

# Dark Mode

Implement full dark mode support.

Requirements:

* Light mode
* Dark mode
* Automatic system theme detection
* Manual theme switch

Persist selected theme.

---

# Settings Page

Create:

```text
settings.html
```

Provide:

* Theme settings
* Gallery view preference
* Slideshow interval preference
* Storage usage statistics
* Total categories
* Total media count
* Clear all application data

---

# Export and Import

Allow metadata backup.

Export:

* Categories
* Tags
* Favorites
* Settings

as JSON.

Import metadata JSON.

Restore all metadata.

Media blobs do not need to be exported.

---

# User Interface Requirements

Design Style:

* Premium
* Modern
* Elegant
* Minimal

Use:

* Tailwind CSS
* Glassmorphism
* Soft shadows
* Rounded corners
* Backdrop blur

Animations:

* Smooth page transitions
* Hover animations
* Modal animations
* Fade effects

Provide:

* Toast notifications
* Confirmation dialogs
* Loading indicators

Examples:

```text
Category Created
Upload Successful
Media Deleted
Favorite Updated
Settings Saved
```

---

# Accessibility Requirements

Implement:

* Keyboard navigation
* Focus states
* ARIA labels
* Accessible dialogs
* Screen-reader-friendly controls

---

# Performance Requirements

The application must remain responsive with large collections.

Implement:

* Lazy loading
* Debounced search
* Efficient IndexedDB queries
* Optimized thumbnail generation
* Infinite scrolling
* Memory-efficient rendering

The application should comfortably handle thousands of media files.

---

# Final Deliverable

Generate complete, production-quality, modular code with:

* Clean architecture
* Reusable components
* Detailed comments
* Separation of concerns
* Maintainable codebase

The final application must be fully functional offline after initial loading and must run entirely inside the browser while being fully compatible with GitHub Pages.
