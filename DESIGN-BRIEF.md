# Design brief: Dev Digest Marketplace catalog

Hand-off for Claude Design. Functional behaviour lives in `SPEC.md`; this file is what a designer needs.

## 1. What this is

A public, English-only, single-page catalog website for a **Claude Code plugin marketplace** maintained by
Oleksandr Martyniuk. Visitors are developers. They arrive with a need ("I need a skill for code review"),
type it, scan result cards, open one to read what it does, and copy a shell command to install it.

It is a static site on GitHub Pages: no accounts, no ratings, no backend. The whole catalog (up to ~10 plugins,
~100 items) is loaded at once and searched instantly in the browser.

**Tone**: calm, technical, utilitarian. A developer tool, not a marketing page. Closer to documentation sites
and package registries than to a landing page. Search is the hero.

**No brand yet**: no logo, no brand colors, no illustrations. Design a neutral, restrained system that can be
re-skinned later by changing a handful of tokens.

## 2. Content types (the only three)

| Type | Meaning | Card shows |
|---|---|---|
| **Plugin** | A bundle of skills/agents; the installable unit | name, description, version, counts ("3 skills · 1 agent") |
| **Skill** | Instructions Claude applies in matching situations | name, description, parent plugin + version |
| **Agent** | A sub-agent Claude delegates to | name, description, parent plugin + version, **tools** (e.g. Read, Grep, Glob) |

Each type needs a distinguishable badge that does **not** rely on color alone (label text and/or icon).

## 3. Screens to design

### 3.1 Home / search results (main screen)
- Header: site title "Dev Digest Marketplace", tagline (one line), and a **global install hint** showing
  `claude plugin marketplace add <org>/dev-digest-marketplace` with a copy button.
- **Search input**: large, prominent, placeholder like *"Describe what you need, e.g. code review skill"*.
  Hint that `/` focuses it. Clear (×) button when non-empty.
- **Filters**: segmented chips `All · Plugins · Skills · Agents` with counts, plus a plugin dropdown.
- **Result summary** line: "7 results for "code review"" (announced to screen readers). If the match was
  partial (only some words matched), say so: "No exact match, showing partial matches".
- **Card grid**: responsive, 1 column on mobile, 2 on tablet, 3 on desktop. Cards are equal height within a row.
- With an empty query: show everything, **grouped by plugin** with a plugin heading per group.

### 3.2 Card (key component)
Contents, top to bottom:
1. Type badge (Plugin / Skill / Agent)
2. Name (monospace or semi-monospace, it is an identifier)
3. Description, clamped to 3 lines
4. Meta row: `plugin-name · v0.1.0`; for agents, tool names as small tags (wrap, clamp to first ~4 with "+N")
5. Actions: primary **Copy install command** (one click, then label changes to "Copied" for ~2s),
   secondary **View details**

Search matches in name/description are highlighted (non-color-only, e.g. underline or weight plus tint).
The whole card is not one giant link; actions are real buttons/links so keyboard order is predictable.
Design states: default, hover, focus-visible, copied.

### 3.3 Detail view (route `#/<type>/<plugin>/<name>`)
Replaces the grid in the same page (back link: "← Back to results", preserves the query).
- Title, type badge, plugin + version, tools (agents).
- Full description.
- **Install section**: 1) the marketplace-add command, 2) the plugin install command, each in a code block with
  a copy button, with a short note: "Skills and agents are installed through their plugin".
- **Source preview**: the file's markdown shown as **read-only plain text** in a monospace block, scrollable
  with a max height, with line wrapping. It is a preview only: **no copy button**, no rendered markdown.
- "View on GitHub" link.
- For a plugin: list of its skills and agents as compact rows linking to their details.

### 3.4 Empty state (no results)
Friendly one-liner, suggestions (try fewer words, remove type words, browse all), and a prominent
**"Request a new skill"** button (opens a GitHub Issue with the query pre-filled).

### 3.5 Loading and error states
- Loading: skeleton cards (index is small, so brief).
- Error (index failed to load): short message + retry button.
- Not-found detail route: "We couldn't find that item" + link home.

### 3.6 Footer
"Maintained by Oleksandr Martyniuk", "Request a new skill", "Contribute" (links to README), "View repository",
and "Index updated <date>". Small and unobtrusive.

## 4. Design system requirements

- **Tokens only**: define colors, spacing, radius, type scale, and shadows as CSS custom properties so the
  theme can be changed in one place. Provide **light and dark** themes (follow `prefers-color-scheme`; no manual toggle in MVP).
- **Color**: neutral grays plus **one** accent color used for focus rings, primary buttons and highlights.
  Choose any accent; it is a placeholder. Keep type badges differentiated by label/shape, with at most subtle tints.
- **Typography**: system font stack for UI, system monospace for names, commands and source preview. No web fonts,
  no external assets. Provide a type scale (e.g. 12/14/16/20/28/40).
- **Spacing**: 4 px base grid; page max width ~1120 px; 16 px side gutters on mobile.
- **Iconography**: only a few simple inline SVG icons (search, copy, check, external link, arrow back). No icon libraries.
- **Motion**: minimal (150 ms fades/hover); respect `prefers-reduced-motion`.

## 5. Accessibility (non-negotiable)

- WCAG 2.2 AA contrast in both themes (4.5:1 text, 3:1 UI components and focus indicators).
- Visible focus on every interactive element; logical tab order; all actions reachable by keyboard; `/` focuses search.
- Semantic landmarks (`header`, `main`, `footer`), one `h1`; result count in an `aria-live="polite"` region.
- Copy buttons announce success ("Copied") to screen readers, not just visually.
- Touch targets at least 44×44 px on mobile.
- Do not convey type or state by color alone.

## 6. Responsive behaviour

| Width | Layout |
|---|---|
| < 640 px | single column; filters scroll horizontally or wrap; plugin dropdown full width; detail view single column |
| 640-1024 px | 2 card columns |
| > 1024 px | 3 card columns, centered container |

## 7. Constraints for implementation (so the design is buildable)

- Plain HTML, CSS and vanilla JS. No framework, no CSS preprocessor, no UI kit.
- No external fonts, images, or icon CDNs; everything inline or self-hosted. Page weight (excluding the index) ≤ 200 KB.
- All content comes from data; any text from the index is treated as untrusted (rendered as text, never HTML).
- Works when served from a sub-path (`/dev-digest-marketplace/`).

## 8. Deliverables requested from Claude Design

1. Mock-ups (light and dark) for: Home with results, Home grouped (empty query), Card states, Detail view
   (skill, agent with tools, plugin), Empty state, Loading, Error, Mobile versions of Home and Detail.
2. A token sheet: colors (with contrast ratios), type scale, spacing, radius, shadow.
3. Component spec: header/search, filter chips, card, code block with copy button, source preview block,
   tags, buttons, footer; each with states.
4. Short notes on interaction details (copy feedback, highlight style, focus order, what `/` does).

## 9. Sample content for mock-ups

- Plugin `example-plugin` v0.1.0: "Starter plugin: one skill and one sub-agent" (1 skill · 1 agent)
- Skill `code-review` (plugin `review-tools` v1.2.0): "Reviews a diff for correctness, readability and security. Use when asked to review a PR or a change."
- Agent `test-engineer` (plugin `review-tools` v1.2.0), tools: `Read, Grep, Glob, Bash`: "Designs test strategy and writes tests for existing code."
- Sample query: `I need a skill for code review` → type filter "Skills", terms `code`, `review`, 3 results.
- Install commands:
  - `claude plugin marketplace add <org>/dev-digest-marketplace`
  - `claude plugin install review-tools@dev-digest-marketplace`
