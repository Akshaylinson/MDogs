Here is a comprehensive set of AI prompts designed to elevate your frontend UI/UX into a **high-end, professional, monochrome (Black & White) editorial gallery**. 

You can copy and paste the **Master Prompt** into your AI coding assistant (ChatGPT, Claude, Cursor, GitHub Copilot) to redesign the application.

---

### 🎨 The Master Prompt (Copy & Paste This)

```markdown
Act as a Principal UI/UX Designer and Senior Frontend Engineer. Your task is to redesign the frontend UI of my "Personal Media Archive" web app. 

The app uses plain HTML5, Tailwind CSS via CDN, and vanilla JavaScript (ES modules). There is no build step or package manager.

### Visual & Architectural Direction: "Editorial Monochrome"
Transform the current design into a hyper-professional, minimalist, high-contrast Black & White aesthetic (inspired by Swiss style typography, high-end photography portfolios, and luxury tech interfaces like Are.na or Leica).

#### 1. Color Palette & Theme System (Monochrome)
- **Light Theme:** Stark Pure White (`#ffffff`) background, Off-White (`#fafafa`) secondary surfaces, Deep Carbon (`#0a0a0a`) text/borders.
- **Dark Theme:** OLED Pure Black (`#000000`) background, Matte Zinc (`#121212` / `#181818`) cards/surfaces, Crisp White (`#ffffff`) text.
- **Borders & Dividers:** Ultra-thin 1px borders (`border-neutral-200` in light, `border-neutral-800` in dark). No heavy drop shadows; rely on crisp borders, subtle elevation, and typography for hierarchy.
- **Accents:** Strictly monochrome. Use high-contrast inversion (e.g., black buttons with white text on hover turning to white buttons with black text and a 1px border) instead of colored accents.

#### 2. Typography & Layout
- Configure Tailwind CDN to use clean, professional sans-serif system fonts (Inter, SF Pro Display, Helvetica Neue).
- **Headers:** Tight tracking (`tracking-tight`), high contrast, editorial weights (medium/semibold).
- **Metadata/Tags:** Monospace or uppercase micro-typography (`text-xs tracking-widest uppercase font-mono`) for dates, file sizes, and item counts to give it an archival/technical feel.

#### 3. Component Enhancements (Tailwind CDN)
Update the HTML templates and classes for the following components:
- **Global Navigation:** A sleek, minimal top bar or sticky sidebar with 1px bottom/right borders, glassmorphic blur (`backdrop-blur-md bg-white/80 dark:bg-black/80`), and sharp navigation items.
- **Category Cards (`index.html`):** Sharp-edged or subtly rounded (`rounded-sm` or `rounded-md`) cards with aspect-ratio containers. On hover, apply a smooth zoom effect on the thumbnail, darken the overlay, and slide up metadata.
- **Gallery Grid (`category.html` / `favorites.html`):** Responsive masonry or CSS grid with tight gaps (`gap-3` or `gap-4`). Media cards should show no UI clutter until hovered over (clean hover states showing only favorite icons and tags in inverted black/white badges).
- **Drag & Drop Upload Zone:** A minimalist dashed 1px border area that transforms with an inverted black/white background when files are dragged over.
- **Fullscreen Viewer:** Theatre-grade dark mode override (`bg-black`). Minimalist floating control bar at the bottom with frosted glass, thin borders, and keyboard shortcuts displayed in `<kbd>` tags.
- **Inputs & Buttons:** Sharp rectangles or minimal pill shapes. Focus states should use a crisp 2px offset ring (`focus:ring-2 focus:ring-black dark:focus:ring-white`).

#### Deliverables Required:
1. Provide the `<script>` configuration block for the Tailwind CDN to set up custom monochrome colors, fonts, and utilities.
2. Provide the updated layout structure (Header, Main Content area, Footer) for `index.html`.
3. Provide the upgraded Tailwind HTML/JS code for the **Category Card**, **Media Gallery Item**, and the **Fullscreen Viewer Overlay**.
4. Ensure all transitions use smooth, subtle easing (`transition-all duration-300 ease-out`).
```

---

### ⚡ Modular Prompts (For Step-by-Step Execution)

If you prefer to update your app page-by-page, use these targeted prompts:

#### Prompt 1: Tailwind CDN Configuration & Global Styles
> "Generate the HTML `<head>` section including the Tailwind CSS CDN script and custom `tailwind.config` script. Configure an 'Editorial Monochrome' theme with pure black (`#000000`), pure white (`#ffffff`), and neutral gray scales. Add custom utilities for 1px sharp borders, minimalist scrollbars, and archival monospace typography. Also include any custom CSS needed in `/css/styles.css` for masonry layouts and smooth glassmorphism without build tools."

#### Prompt 2: Dashboard (`index.html`) Redesign
> "Redesign the `index.html` dashboard layout using our monochrome Tailwind theme. Create a clean, high-end header with a search bar and theme toggle. Below it, design a 'Category Grid'. Each category card should look like a professional photo folder: a 1px border, a high-contrast cover image container, monospace file counts (e.g., `[ 24 ITEMS ]`), and actions (rename/delete) that appear smoothly on hover."

#### Prompt 3: Gallery & Drag-and-Drop (`category.html`)
> "Redesign the `category.html` gallery page. Include:
> 1. A sleek header showing the Category Title, item count, and action buttons (Upload, Slideshow).
> 2. A drag-and-drop upload dropzone that looks like a technical schematic blueprint (1px dashed monochrome borders, clean typography).
> 3. A dense, high-performance gallery grid. Media items should have zero padding/borders, fitting seamlessly together. Hovering over an item darkens it slightly and reveals a stark white favorite heart icon and black-and-white tag pills."

#### Prompt 4: Fullscreen Viewer & Slideshow (`viewer.js`)
> "Design the DOM overlay structure for the Fullscreen Media Viewer. It must feel like a professional photo grading tool (like Lightroom or Apple Photos). Use a pure black background (`bg-black`). Add a bottom floating control bar with `backdrop-blur-md bg-zinc-900/80 border border-zinc-800` containing Prev/Next buttons, Play Slideshow, Favorite, and Info toggles. Add subtle `<kbd>` shortcuts overlaying the screen edges (e.g., `ESC` to close, `←/→` to navigate)."

---

### 💡 Design Tips for Your Monochrome Archive

When implementing this, keep these key principles in mind to ensure it feels **premium** rather than just "colorless":

1. **Use Texture & Elevation Instead of Color:** Since you lack color cues, differentiate UI layers using background blurs (`backdrop-blur-lg`), border opacities (`border-black/10` vs `border-black/30`), and subtle background shifts (Pure White to Zinc-50).
2. **High-Contrast Badges for Tags:** Display tags using inverted colors. If the card is white, the tag pill should be pure black with white text (`bg-black text-white text-xs px-2 py-0.5 rounded-none font-mono`).
3. **Skeleton Loading:** When fetching media from IndexedDB, use a subtle shimmer effect on a `zinc-100` (light) or `zinc-900` (dark) background rather than spinners.