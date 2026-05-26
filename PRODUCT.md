# Product

## Register

product

## Users

Two audiences, served as a single contract:

- **Rocket.Chat core engineers** (primary): internal developers building the main client, admin, EE features, and the embeddable Livechat widget on top of Fuselage. They reach for components and semantic tokens dozens of times a day and expect predictable props, stable APIs, and theming that falls out of the token layer without per-component overrides.
- **Product designers** (primary): designers consuming tokens and components who need parity between Figma and code. A token or component must mean the same thing in design tooling as it does in the codebase.

Secondary: open-source community contributors and Rocket.Chat App / UiKit developers, who must be able to extend or match the system without reading the maintainers' minds.

## Product Purpose

Fuselage is Rocket.Chat's open-source design system: the single source of truth for the product's UI. It ships React components, semantic design tokens, hooks, and icons that consuming surfaces (the main client, admin, Livechat, UiKit blocks) compose into a consistent interface.

Scope is **library-first**: this document governs the design system as the source of truth, with consuming-app theming (theme wrappers, CSS variables, dynamic CSS) as secondary context for how the system is applied.

Success looks like: an engineer assembles an on-brand, accessible, themeable screen from Fuselage primitives without writing bespoke CSS or fighting the system, and a designer sees the result match their Figma without translation loss.

## Brand Personality

**Neutral and systematic.** Fuselage is invisible scaffolding. Calm, consistent, and out of the way. Components serve the product, never themselves; nothing in the system competes with the content it frames. The voice is that of infrastructure you trust and stop noticing, closer to Radix or Base Web than to a personality-forward kit.

Three words: **systematic, calm, dependable.**

## Anti-references

- **Material / MUI heaviness.** No elevation-everywhere, ripple effects, dense theming configuration, or opinionated motion that fights the host product.
- **Tailwind-style utility soup.** Utility classes are not the public API. The system exposes components and semantic tokens, not ad-hoc stacks of utility classes.
- **Bootstrap genericness.** Must not read as an off-the-shelf framework. The result should feel like Rocket.Chat, not like any-app-on-the-internet.
- **Over-branded / playful kits.** No gradients-for-decoration, mascots, flourishes, or trend-chasing that ages fast in an enterprise communications tool.

Rigor model: **GitHub Primer.** Token-driven, OSS-first, strong contribution documentation, accessibility treated as a gate rather than a backlog item. Match that bar.

## Design Principles

1. **Invisible by design.** The system serves the product. A Fuselage component should never draw attention to itself over the content it frames; the right outcome is that nobody notices the component, only the work it enables.
2. **Tokens are the contract.** Semantic tokens, not raw values, are the API surface. Theming, dark mode, and density fall out of the token layer, not from per-component overrides. A raw hex or magic number in a component is a bug.
3. **Accessible or it doesn't ship.** WCAG 2.1 AA is a CI gate, not an aspiration. Keyboard navigation, ARIA semantics, contrast, and reduced-motion are proven per component before it lands.
4. **One source of truth, two consumers.** Code and Figma stay in parity. A token or component name means the same thing to an engineer and a designer; divergence between the two is a defect in the system, not a translation problem for the user to absorb.
5. **OSS-legible.** Public APIs are predictable, props are documented, behavior is demonstrated in Storybook. A community contributor can extend the system without insider knowledge.

## Accessibility & Inclusion

**WCAG 2.1 AA, enforced.** AA contrast ratios, full keyboard navigation, correct ARIA roles and states, reduced-motion support, and screen-reader testing are baked into every component and gated in CI. Color is never the sole carrier of meaning. Motion respects `prefers-reduced-motion`. Accessibility regressions block merge.
