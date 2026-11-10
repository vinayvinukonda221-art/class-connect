---
version: alpha
name: Render Modern Light
description: A crisp, developer-focused light system with stark contrast, minimal framing, and a single vivid purple accent.
colors:
  primary: "#6C35F5"
  primary-60: "#8B63F8"
  primary-70: "#7A4CF6"
  primary-90: "#4E22C8"
  secondary: "#0D0D0D"
  tertiary: "#E5E7EB"
  neutral: "#FFFFFF"
  surface: "#FFFFFF"
  surface-muted: "#F8F8FB"
  on-surface: "#0D0D0D"
  on-surface-muted: "#4D4D4D"
  border: "#E3E3E3"
  border-subtle: "#E5E7EB"
  success: "#1F8A5B"
  error: "#D92D20"
typography:
  headline-display:
    fontFamily: PPNeueMontreal
    fontSize: 76.4444px
    fontWeight: 500
    lineHeight: 82.56px
    letterSpacing: -2.29333px
  headline-lg:
    fontFamily: PPNeueMontreal
    fontSize: 64px
    fontWeight: 500
    lineHeight: 68px
    letterSpacing: -1.92px
  headline-md:
    fontFamily: PPNeueMontreal
    fontSize: 32px
    fontWeight: 500
    lineHeight: 36px
    letterSpacing: -0.64px
  headline-sm:
    fontFamily: ui-sans-serif
    fontSize: 18px
    fontWeight: 500
    lineHeight: 22px
    letterSpacing: 0px
  body-lg:
    fontFamily: PPNeueMontreal
    fontSize: 18px
    fontWeight: 400
    lineHeight: 28px
    letterSpacing: 0.03px
  body-md:
    fontFamily: PPNeueMontreal
    fontSize: 16px
    fontWeight: 400
    lineHeight: 26px
    letterSpacing: 0.09px
  body-sm:
    fontFamily: PPNeueMontreal
    fontSize: 14px
    fontWeight: 400
    lineHeight: 22px
    letterSpacing: 0.06px
  label-lg:
    fontFamily: PPNeueMontreal
    fontSize: 16px
    fontWeight: 500
    lineHeight: 22px
    letterSpacing: 0px
  label-md:
    fontFamily: PPNeueMontreal
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0px
  label-sm:
    fontFamily: PPNeueMontrealMono
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
    letterSpacing: 0.02em
  code-md:
    fontFamily: PPNeueMontrealMono
    fontSize: 13px
    fontWeight: 400
    lineHeight: 20px
    letterSpacing: 0px
rounded:
  none: 0px
  sm: 2px
  md: 4px
  lg: 8px
  xl: 12px
  full: 9999px
spacing:
  xs: 6px
  sm: 16px
  md: 24px
  lg: 44px
  xl: 72px
  gutter: 24px
  section: 72px
components:
  button-primary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.on-surface-muted}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: "12px 20px"
    height: "40px"
  button-tertiary:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.none}"
    padding: "0px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "16px"
  card-elevated:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "12px 14px"
  chip:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: "4px 10px"
  badge-live:
    backgroundColor: "#E6F6EE"
    textColor: "{colors.success}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
  badge-deploying:
    backgroundColor: "#EFE7FF"
    textColor: "{colors.primary}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: "4px 8px"
  banner:
    backgroundColor: "#F4F0FF"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: "8px 12px"
  code-panel:
    backgroundColor: "#121212"
    textColor: "{colors.neutral}"
    typography: "{typography.code-md}"
    rounded: "{rounded.sm}"
    padding: "16px"
---

# Render Modern Light

## Overview
Render feels technical, calm, and highly confident: a product-led infrastructure brand that speaks to developers without visual clutter. The page is spacious and editorial, with sharp contrast, restrained decoration, and a single electric purple accent that signals action and state. The overall tone is professional and efficient, but still polished and slightly playful in the product illustration and status pills.

## Colors
- **Primary (#6C35F5):** The vivid Render purple used for links, focus accents, deployment states, subtle highlights, and branded emphasis. It provides the only strong chromatic contrast against the otherwise neutral interface.
- **Secondary (#0D0D0D):** Near-black used for primary headlines, top-nav text, solid call-to-action buttons, and terminal panels. It gives the system its strong developer-grade contrast.
- **Surface (#FFFFFF):** The main canvas for navigation, cards, and page background. It keeps the interface airy and lets content feel lightweight despite the dense product messaging.
- **Surface muted (#F8F8FB):** A soft off-white used when a layer needs to separate slightly from the main background without introducing visible color noise.
- **On-surface muted (#4D4D4D):** Used for body copy, secondary labels, and supporting navigation text. It stays legible while preserving the hierarchy of the dark primary text.
- **Border (#E3E3E3) and border subtle (#E5E7EB):** Hairline separators for buttons, cards, and structural framing. These are quiet and functional rather than decorative.
- **Success (#1F8A5B):** A restrained green for “Live” and completed statuses in the product mockup.
- **Error (#D92D20):** Reserved for destructive or failure states, even though it is not prominent in the screenshot.

## Typography
The system is anchored by PP Neue Montreal, which gives headlines and body copy a modern, slightly condensed editorial feel. Headings use a medium weight with tight negative letter spacing, especially at display sizes, creating a strong and compact hero treatment without feeling heavy.

Body text stays in PP Neue Montreal at 16px with generous line height for readability. Labels and CTAs use medium weight to keep UI actions crisp and clear, while monospace styling appears in status/readout contexts like the terminal and small metadata. There is little evidence of uppercase-heavy branding in the main UI; instead, emphasis comes from size, weight, and spacing rather than forced casing.

## Layout
The layout is wide, centered, and built around a fixed-max-width hero structure with lots of breathing room around the main message. Sections use large vertical rhythm, with generous separation between navigation, hero copy, and the product illustration.

Spacing is modular and clean: 6px for tight internal adjustment, 16px and 24px for standard component padding, then 44px and 72px for section-scale separation. Cards and panels rely on consistent internal padding rather than dense nested spacing, and the overall page favors horizontal alignment and open whitespace over crowded grids.

## Elevation & Depth
Depth is subtle and mostly achieved through contrast, borders, and tonal layering rather than heavy shadow systems. The UI uses thin borders, soft separation, and occasional small shadows for cards, while the illustration panel adds visual depth through a textured gradient and a dark terminal surface.

Because the system is largely flat, hierarchy comes from compositional contrast: black on white, white cards on light backgrounds, and purple status accents. The result is modern and precise rather than material or skeuomorphic.

## Shapes
The shape language is restrained and architectural. Corners are usually small and controlled, with 2px to 8px radii depending on component importance: buttons are sharper, cards are softly rounded, and pills use full rounding or compact rounded rectangles.

This keeps the interface feeling engineered and dependable. Nothing is overly bubbly or soft; the geometry stays crisp to match the product’s infrastructure positioning.

## Components
Buttons are the most distinct interactive element in the system. `button-primary` uses a solid black fill with white text, compact padding, and a small radius for a decisive CTA look. `button-secondary` is a light outlined/inverse treatment for supporting actions, and `button-tertiary` is text-only or transparent for low-emphasis actions such as links.

Button sizing should remain compact and predictable: about 40px tall with 12px vertical and 20px horizontal padding. Hover states should darken or otherwise strengthen contrast without adding dramatic shadow or motion. Avoid oversized pill buttons; the brand prefers firm rectangular CTAs.

Cards use white backgrounds, thin gray borders, and 8px radii. They should feel like lightweight containers rather than floating panels, with 16px interior padding and minimal decoration. In dashboards or product mockups, cards can stack in grids with consistent spacing and strong label/value contrast.

Inputs should match the same low-friction geometry as cards and buttons: white background, subtle border, 4px radius, and clean 16px body text. Focus states should lean on the purple accent rather than thick outlines or glow effects.

Chips and badges are small state carriers. Use `chip` for neutral metadata or tags, and use status variants like `badge-live` and `badge-deploying` for operational labels. These should stay compact, softly rounded, and color-coded with very light fills and strong text contrast.

The hero banner and announcement strip should feel lightweight and promotional, not noisy. Use pale purple backgrounds with small type and compact padding, keeping the message visible without competing with the main CTA. Code or terminal surfaces should be nearly black with monospace text, subtle separators, and minimal chrome.

## Do's and Don'ts
- Do keep the visual system sparse, high-contrast, and centered on one strong primary accent.
- Do use PP Neue Montreal for most UI text and reserve monospace styling for code, logs, and technical metadata.
- Do keep buttons compact, rectangular, and confident rather than oversized or overly rounded.
- Do use thin borders and whitespace to create hierarchy before reaching for shadows.
- Don't introduce multiple saturated brand colors; the interface should stay mostly neutral with purple as the only dominant accent.
- Don't overuse shadows, gradients, or glass effects in general UI components.
- Don't make cards or buttons feel soft, playful, or heavily pill-shaped.
- Don't crowd sections; maintain the generous spacing rhythm visible in the hero and product showcase.

