---
name: Studio Terracotta
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#5a4138'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#8e7166'
  outline-variant: '#e2bfb2'
  surface-tint: '#a73a00'
  primary: '#a33900'
  on-primary: '#ffffff'
  primary-container: '#cc4900'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb599'
  secondary: '#4e45d5'
  on-secondary: '#ffffff'
  secondary-container: '#6860ef'
  on-secondary-container: '#fffbff'
  tertiary: '#006947'
  on-tertiary: '#ffffff'
  tertiary-container: '#00855b'
  on-tertiary-container: '#f5fff6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbce'
  primary-fixed-dim: '#ffb599'
  on-primary-fixed: '#370e00'
  on-primary-fixed-variant: '#7f2b00'
  secondary-fixed: '#e3dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#100069'
  on-secondary-fixed-variant: '#372abf'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.25rem
  space-xl: 1.5rem
  space-2xl: 2rem
  space-3xl: 2.5rem
  wechat-capsule-safe-top: 5.5rem
  wechat-home-indicator-safe-bottom: 2.125rem
---

## Brand & Style

This design system establishes an accessible, studio-grade aesthetic tailored for independent artisans, boutique curators, and micro-merchants on WeChat Mini Programs. It positions image generation and visual curation as intuitive, warm, and precise, avoiding both corporate dryness and visual clutter.

The philosophy combines tactile minimalism with refined editorial warmth:
- **Image-First Canvas:** The interface acts as a silent gallery frame. Chromatic energy is concentrated on merchant product imagery and targeted action triggers.
- **Approachable Craftsmanship:** Uses warm paper tones and clay accents to evoke bespoke craftsmanship and physical studio workbenches.
- **Clarity and Focus:** Zero gratuitous decoration. High visual legibility preserves merchant workflow speed inside mobile single-hand operating zones.

## Colors

The palette balances warm organic undertones with high-contrast functional hues to satisfy accessibility standards across varying mobile screens.

- **Primary (`#EA580C`):** Terracotta Ember. Serves as the primary operational signature for key generation triggers, progress highlights, and essential badges.
- **Secondary (`#4338CA`):** Deep Studio Indigo. Used sparingly for template presets, system tags, and creative mode toggles to contrast with the warm primary tone.
- **Tertiary (`#10B981`):** Herbal Green. Reserved strictly for successful export states, cloud sync indicators, and image ready notifications.
- **Neutral Surface Palette:**
  - Canvas Root Background: `#FBF9F5` (warm tactile linen tint).
  - Surface Floating Cards: `#FFFFFF` (pure white to let product photos pop).
  - Subtle Borders & Dividers: `#EBE7DF` (warm architectural gray).
- **Typography Hierarchy (High Legibility):**
  - Primary Headlines & Titles: `#1E293B` (rich ink gray, avoiding harsh pure black).
  - Secondary Body & Metric Labels: `#475569` (grounded slate).
  - Tertiary / Captions / Helper Text: `#64748B` (refined neutral slate; never drop contrast below 4.5:1).

## Typography

Typography relies on geometric warmth and clear legibility at compact mobile scales. It adapts seamlessly to systemic bilingual pairings (Latin with PingFang SC / System UI).

- `headline-xl` (28px / 36px, Bold): Screen titles on onboarding and post-generation success summaries.
- `headline-lg` (22px / 28px, Bold): Section headers and major modal sheet titles.
- `headline-md` (18px / 24px, SemiBold): Step headers and product name inputs.
- `headline-sm` (16px / 22px, SemiBold): Card title headings and tool segment labels.
- `body-lg` / `body-md`: Primary reading copy, tips, step explanations, and template descriptions.
- `label-lg` / `label-md` / `label-sm`: Button labels, status chips, tool badges, and bottom navigation titles.

## Layout & Spacing

Layout adheres to the WeChat Mini Program viewport standard benchmarked at 390px base width.

- **Horizontal Margins:** Fixed outer gutters at `16px` (`1rem`) on standard mobile widths, increasing to `20px` (`1.25rem`) on larger devices.
- **Safe Area Insets:**
  - **Top:** The custom navigation bar reserves `wechat-capsule-safe-top` (88px dynamic window) to prevent overlaps with the native WeChat Capsule buttons (Exit / More).
  - **Bottom:** Fixed footer bars reserve dynamic padding equal to `16px` + `env(safe-area-inset-bottom)` (`wechat-home-indicator-safe-bottom`) ensuring interaction clearance from the iOS indicator bar.
- **Rhythm Hierarchy:**
  - `space-xs` (8px): Internal gaps between chips, icon-to-label distances.
  - `space-md` (16px): Card internal padding, field stacks.
  - `space-lg` (20px): Structural vertical gaps between form modules.
  - `space-2xl` (32px): Separation between sequence blocks.

## Elevation & Depth

Visual hierarchy uses warm ambient diffusion paired with crisp structural hairline frames rather than heavy artificial drop shadows.

- **Level 0 (Base Canvas):** `#FBF9F5` flat matte surface.
- **Level 1 (Card & Module Layer):** Pure `#FFFFFF` surface framed with a 1px solid border (`#EBE7DF`) and a diffuse, warm-tinted shadow: `box-shadow: 0 2px 8px -2px rgba(30, 41, 59, 0.04), 0 4px 16px -4px rgba(234, 88, 12, 0.03)`.
- **Level 2 (Floating Action Bars & Modals):** Pure `#FFFFFF` background with `backdrop-filter: blur(12px)` when translucent, elevated with: `box-shadow: 0 -4px 20px rgba(30, 41, 59, 0.06)`.
- **Active / Dragging Overlays:** Tinted elevation using `box-shadow: 0 12px 28px -6px rgba(234, 88, 12, 0.18)` indicating tactile lift during canvas layout adjustments.

## Shapes

The shape system balances modern geometric structure with humanistic craft softness.

- **Cards & Image Containers:** `16px` border-radius (`rounded-lg`) creates an inviting photo mat frame.
- **Interactive Buttons:** `12px` border-radius to ensure clear button affordance at standard 48px heights.
- **Tags, Badges, and Chips:** `8px` (`space-xs`) for compact structural readability.
- **Modal Drawers & Bottom Sheets:** `20px` top radius (`rounded-xl`) conforming to mobile natural thumb reach.

## Components

### Buttons
- **Primary CTA:** Minimum height 48px (exceeding the 44px touch mandate). Background `#EA580C`, text `#FFFFFF`, font `label-lg`, radius `12px`. Pressed state shifts to `#C2410C` with slight 0.98 scale transform.
- **Secondary Ghost/Outline:** Minimum height 48px. Surface `#FFFFFF`, border 1px solid `#EBE7DF`, text `#1E293B`. Pressed state shifts to background `#F8F6F2`.
- **Icon Utility Actions:** 40px square, radius 10px, background `#F8F6F2`, icon tint `#475569`.

### Status Badges & Chips
- **Category / Filter Chip:** Height 32px, radius 8px, border 1px solid `#EBE7DF`, text `#475569`. Active state transitions to background `#FFF7ED`, border `#EA580C`, text `#EA580C`.
- **Status Tags (e.g., "AI Ready", "HD Export"):** Padding 2px 8px, font `label-sm`, radius 6px. Uses semantic pastel backgrounds with full-chroma text (e.g., `#ECFDF5` with `#059669`).

### Step Indicator (Progress Header)
- Horizontal 3-step or 4-step sequence: Step icon/number enclosed in a 24px circle.
- Completed: Background `#10B981`, checkmark icon `#FFFFFF`.
- In-Progress: Background `#EA580C`, text `#FFFFFF`, ring 3px `#FFEDD5`.
- Inactive: Background `#E2E8F0`, text `#64748B`.
- Connecting tracks use 2px lines in `#EBE7DF` or `#EA580C`.

### Product Image Comparison & Preview Card
- Dual-pane or split-slider container with `16px` radius and 1px border `#EBE7DF`.
- Pure white matte background container.
- Floating overlay tags: `Original` (Slate translucent `#1E293Bcc`) vs `Studio Render` (Terracotta translucent `#EA580Cdd`) positioned top-left/top-right.

### Form Inputs & Text Areas
- Min height 48px, background `#FFFFFF`, border 1px solid `#EBE7DF`, radius 12px, horizontal padding 14px.
- Placeholder text in `#94A3B8`. Active focus border shifts to `#EA580C` with 3px focus ring `#FFEDD5`.

### Fixed Bottom Operations Bar
- Fixed layout spanning 100% width, background `#FFFFFF` with safe-area bottom inset padding.
- Top divider: 1px solid `#EBE7DF`.
- Standard configuration: Secondary action (Share/Draft) occupying 35% width alongside Primary generation action occupying 65% width.