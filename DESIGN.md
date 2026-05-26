---
name: Fuselage
description: Rocket.Chat's open-source design system. Token-driven, three-theme, accessible by gate.
colors:
  rocket-blue: "#156FF5"
  rocket-blue-hover: "#095AD2"
  rocket-blue-press: "#10529E"
  featured-purple: "#5F1477"
  danger-red: "#EC0D2A"
  success-green: "#1ECB92"
  warning-yellow: "#F3BE08"
  surface-light: "#FFFFFF"
  surface-tint: "#F7F8FA"
  surface-hover: "#F2F3F5"
  surface-selected: "#D7DBE0"
  font-default: "#2F343D"
  font-titles: "#1F2329"
  font-hint: "#6C737A"
  font-on-color: "#FFFFFF"
  stroke-extra-light: "#EBECEF"
  stroke-light: "#CBCED1"
  stroke-medium: "#9EA2A8"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "48px"
    fontWeight: 800
    lineHeight: "64px"
    letterSpacing: "0"
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: "40px"
    letterSpacing: "0"
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "32px"
    letterSpacing: "0"
  subtitle:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: "24px"
    letterSpacing: "0"
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
    letterSpacing: "0"
  label:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: "16px"
    letterSpacing: "0"
  mono:
    fontFamily: "Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
    letterSpacing: "0"
rounded:
  fine: "2px"
  medium: "4px"
  large: "8px"
  extra-large: "20px"
  full: "9999px"
spacing:
  hairline: "1px"
  fine: "2px"
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.rocket-blue}"
    textColor: "{colors.font-on-color}"
    typography: "{typography.body}"
    rounded: "{rounded.medium}"
    padding: "0 16px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.rocket-blue-hover}"
    textColor: "{colors.font-on-color}"
  button-secondary:
    backgroundColor: "{colors.surface-selected}"
    textColor: "{colors.font-titles}"
    typography: "{typography.body}"
    rounded: "{rounded.medium}"
    padding: "0 16px"
    height: "40px"
  button-danger:
    backgroundColor: "{colors.danger-red}"
    textColor: "{colors.font-on-color}"
    typography: "{typography.body}"
    rounded: "{rounded.medium}"
    height: "40px"
  input:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.font-default}"
    typography: "{typography.body}"
    rounded: "{rounded.medium}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.font-default}"
    rounded: "{rounded.large}"
    padding: "20px 12px"
  tile:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.font-default}"
    typography: "{typography.body}"
    rounded: "{rounded.medium}"
  callout:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.font-default}"
    rounded: "{rounded.medium}"
    padding: "12px"
  chip:
    backgroundColor: "{colors.surface-selected}"
    textColor: "{colors.font-hint}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
---

# Design System: Fuselage

## 1. Overview

**Creative North Star: "The Field Manual"**

Fuselage is reference material, not decoration. It reads like a well-kept field manual: every value has a name, every name has a place, and an engineer or designer can look up the right answer instead of guessing it. The identity is the rigor. Token-driven from the ground up, documented in Storybook, predictable in every state. The closest spiritual sibling is GitHub Primer, where accessibility is a gate and the system's discipline is the thing people trust.

The surface itself stays quiet so the product can speak. Neutral, lightly tinted surfaces carry the room; saturated color is reserved for meaning (an action, a status, a featured object), never spent on ambient styling. Density favors legibility: the default body type is 14px with tight line-height, sized for people who read this interface for hours. Nothing competes with the message being sent through Rocket.Chat.

This system explicitly rejects Material/MUI heaviness (elevation everywhere, ripple, opinionated motion), Tailwind-style utility soup as a public API, Bootstrap genericness that reads as any-app-on-the-internet, and over-branded playful kits with gradients and mascots that age fast in an enterprise communications tool.

**Key Characteristics:**
- Token contract: components consume semantic roles, never raw hex.
- Three themes from one base set: light, high-contrast, dark.
- Flat by default; elevation and color are earned by state or meaning.
- 4px spatial grid, enforced at the function level.
- Inter for UI, accessible at AA across all themes.

## 2. Colors: The Functional Spectrum

A near-neutral surface field with a small set of saturated colors that only appear when they carry meaning. The same base ramps resolve into three themes; the frontmatter holds the light (default) values, and the sidecar carries each color's full ramp and dark-theme counterpart.

### Primary
- **Rocket Blue** (`#156FF5`, b500): the single primary-action color. Primary buttons, focus rings, links, info highlights. Darkens to `#095AD2` on hover and `#10529E` on press. The one color a user can trust to mean "this is the actionable thing".

### Secondary
- **Featured Purple** (`#5F1477`, p700): reserved for featured surfaces and brand-forward moments (featured rooms, promoted UI). Not a general accent; its scarcity is what makes it read as "special".

### Tertiary (status, never used decoratively)
- **Success Green** (`#1ECB92`, g600): success states, paired with a darker green font on a light green fill.
- **Warning Yellow** (`#F3BE08`, y600): warnings, paired with deep-yellow text.
- **Danger Red** (`#EC0D2A`, r500): destructive actions, errors, danger buttons.
- Service accents (orange `o`, purple `p`) exist for categorical tagging, always shipped as a background plus a matched `font-on-*` text color so contrast holds.

### Neutral
- **Surface Light** (`#FFFFFF`): primary surface and room background.
- **Surface Tint** (`#F7F8FA`, n100): subtly raised panels, sidebars, app chrome.
- **Surface Hover / Selected** (`#F2F3F5` / `#D7DBE0`): interaction feedback on neutral rows.
- **Font Titles** (`#1F2329`, n900) and **Font Default** (`#2F343D`, n800): titles and body text. Note these are tinted dark-blue-grey, never pure black.
- **Font Hint** (`#6C737A`, n700): secondary info, annotations, placeholders.
- **Strokes** (`#EBECEF` extraLight through `#9EA2A8` medium, n250 to n600): borders and dividers, climbing the neutral ramp by emphasis.

### Named Rules
**The Token Contract Rule.** Components reference semantic roles (`surface.tint`, `font.default`, `stroke.light`), never raw ramp values. A literal hex inside a component is a defect, not a shortcut.

**The Three-Theme Rule.** Every color decision must resolve correctly in light, high-contrast, and dark. Dark is hand-tuned (its own hex values), never an algorithmic inversion of light.

**The Meaning-Only Color Rule.** Saturated color marks an action, a status, or a featured object. It is never spent on ambient decoration. If a screen is mostly neutral with rare color, that is correct.

## 3. Typography

**Display / Body Font:** Inter (with `-apple-system`, `Segoe UI`, `Roboto`, system fallbacks, plus emoji).
**Mono Font:** Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace (code, message blocks, technical values).

**Character:** One workhorse sans across the whole hierarchy, differentiated by scale and weight rather than by mixing families. The result is calm and uniform, the opposite of an expressive type pairing. Inter's high x-height keeps 12px to 14px text legible at chat density.

### Hierarchy
- **Display / hero** (800, 48px, 64px line-height): marketing-scale display, rare inside the app.
- **Headline / h1** (700, 32px, 40px): page titles.
- **Title / h2 to h3** (700, 24px to 20px, 32px to 28px): section and subsection headings.
- **Subtitle / h4 to h5** (700, 16px to 14px, 24px to 20px): block and dense headings.
- **Body / p1 to p2** (400/500/700, 16px or 14px, 24px or 20px): paragraph text. 14px (p2) is the chat default. Cap measure at 65 to 75ch.
- **Caption / label** (400/700, 12px, 16px) and **micro** (700, 10px, 12px): captions, overlines, badge text.

### Named Rules
**The Weight-Not-Tracking Rule.** Letter-spacing is 0 across the entire scale. Hierarchy comes from size and weight contrast, never from manual tracking. If two levels look too similar, change weight or size, not spacing.

## 4. Elevation

Flat by default, lifted by state. Surfaces sit flush at rest. Depth is conveyed first by tonal layering (surface tint and hover steps) and by borders; shadow is reserved for genuine elevation (menus, popovers, opt-in raised tiles) and for hover/focus response. There is no ambient drop-shadow on resting cards. Dark theme deepens shadow opacity rather than reusing the light values.

### Shadow Vocabulary
- **elevation-border** (`#EBECEF` light, `#2F343D` dark): a 1px definition border where a shadow would be too subtle.
- **elevation-1** (`box-shadow` from `rgba(47,52,61,0.1)` light, `rgba(9,9,9,0.35)` dark): low lift for hovered or single-step raised surfaces (Tile elevation-1).
- **elevation-2** (composed from `rgba(47,52,61,0.08)` and `rgba(47,52,61,0.12)`; dark `rgba(9,9,9,0.3)` / `0.45`): menus, popovers, modals (Tile elevation-2).

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadow appears only as a response to state (hover, focus) or as an explicit elevation level (`elevation-1`, `elevation-2`). A resting card with a drop shadow is wrong; raise it with a border or a tint step instead.

## 5. Components

The feel across the set is **precise and legible**: tight, instrument-grade defaults optimized for density and scanning, quiet in their resting state.

### Buttons
- **Shape:** gently squared (4px radius, `rounded.medium`). Fixed 40px height, 16px horizontal padding, body-strong type (14px / 500). A subtle click-animation on press; status buttons excluded.
- **Primary:** Rocket Blue (`#156FF5`) fill, white text. Hover `#095AD2`, press `#10529E`, disabled `#D1EBFE`.
- **Secondary:** neutral fill (`#E4E7EA`) climbing to `#CBCED1` hover / `#9EA2A8` press, dark text. The everyday button.
- **Danger:** Danger Red (`#EC0D2A`) fill, white text, for destructive confirms only.
- **Ghost / secondary-danger:** transparent or neutral background with colored text; used inline where a filled button would shout.

### Inputs / Fields
- **Style:** white surface, 1px neutral border, 4px radius (`rounded.medium`), 8px/16px padding, 144px min-width, 14px body text.
- **Focus:** border shifts to Rocket Blue (`stroke.highlight`) with a soft highlight ring. No glow bloom.
- **Error:** border and ring shift to error red (`stroke.error`); `:invalid` is styled, not just colored, and pairs with a text message (never color alone).

### Cards / Containers
- **Corner Style:** rounded (8px radius, `rounded.large`), softer than controls.
- **Background:** Surface Light (`#FFFFFF`); clickable cards shift to Surface Hover on hover/focus.
- **Shadow Strategy:** flat at rest per the Flat-By-Default Rule. Use a Tile with `elevation-1`/`elevation-2` when genuine lift is needed.
- **Internal Padding:** 20px vertical, 12px horizontal, 8px internal gaps; 28px for hero cards.

### Tile
- **Style:** the elevation primitive. 4px radius, Surface Light, body text, with explicit `elevation-0` (none), `elevation-1`, `elevation-2` levels. Use Tile, not Card, when the only job is to raise content.

### Callout
- **Style:** full 1px border (never a side stripe), 4px radius, 12px padding, status-colored border and text (info / success / warning / danger) drawn from the `font-on-*` status tokens.

### Chips / Tags
- **Style:** pill (`rounded.full`), secondary-button background (`#D7DBE0` family), hint-colored text, label type (12px / 700). Hover, active, and focus states track the secondary-button color set; focus adds a dark stroke plus shadow.
- **Badge:** four severity levels (level-1 to level-4) plus ghost, white text on a saturated fill, for counts and status pips.

### Navigation
- **Style:** neutral sidebar surface (`surface.sidebar`, n400 light / `#2F343D` dark), body type. Items rest flat; hover uses Surface Hover, the active item uses Surface Selected. Selection is a fill change, not a colored left stripe.

## 6. Do's and Don'ts

### Do:
- **Do** reference semantic tokens (`surface.tint`, `font.default`, `stroke.light`) in every component. A raw hex is a defect.
- **Do** verify every change in light, high-contrast, and dark before it lands.
- **Do** keep surfaces flat at rest and raise them with a border or tint step; use `elevation-1`/`elevation-2` only for genuine lift.
- **Do** size spacing on the 4px grid (`none`, `1`, `2`, or multiples of 4); the build rejects anything else.
- **Do** carry status meaning with paired text/icon, never color alone, and use the matched `font-on-*` token for contrast.
- **Do** build hierarchy from size and weight; keep letter-spacing at 0.

### Don't:
- **Don't** reach for Material/MUI heaviness: no elevation-everywhere, ripple effects, or opinionated motion that fights the host product.
- **Don't** expose Tailwind-style utility soup as the API; compose components and semantic tokens, not ad-hoc utility stacks.
- **Don't** let the result read as Bootstrap genericness or any-app-on-the-internet; it must feel like Rocket.Chat.
- **Don't** ship over-branded, playful flourishes: no decorative gradients, mascots, or trend-chasing that ages fast in an enterprise comms tool.
- **Don't** use a `border-left` greater than 1px as a colored accent stripe on cards, list items, or callouts; use a full border or a tint instead.
- **Don't** spend saturated color on ambient decoration; reserve it for actions, status, and featured objects.
- **Don't** put a resting drop-shadow on a card. If it looks like a 2014 app, the shadow is too dark and standing where it shouldn't.
