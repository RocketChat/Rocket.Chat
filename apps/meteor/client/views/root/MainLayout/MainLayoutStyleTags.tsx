import { PaletteStyleTag } from '@rocket.chat/fuselage';
import { useThemeMode } from '@rocket.chat/ui-client';

import { codeBlock } from '../lib/codeBlockStyles';

// dark-alpha only: the app shell must not paint over <body>, so the body
// background (the theme anchor) shows through the translucent surfaces.
// Elevated surfaces are translucent veils, so they blur whatever sits
// behind them to stay legible over arbitrary content.
const darkAlphaShell = `#rocket-chat.menu-nav {
	/* !important to outweigh the Box backgroundColor prop's css-in-js rule */
	background-color: transparent !important;
}
/* vibrancy-demo tuning (quick test, user-approved live): stronger glass —
   anchor thinner and menus as real frosted panes. TODO: if kept, move the
   two var values into the dark-alpha tokens (tint / light). */
:root,
.rcx-content--main,
.rcx-tile,
.rcx-sidebar--main,
.rcx-sidepanel,
.rcx-navbar {
	--rcx-color-surface-tint: rgba(23, 24, 26, 0.15) !important;
	--rcx-color-surface-light: ${
		// Chromium silently drops backdrop-filter inside transparent windows
		// (it may flash for a frame on open, then vanish), so inside the
		// desktop app the frosted-glass menu recipe is impossible: use a
		// denser veil for legibility there, and the real frosted pane in
		// browsers where the blur actually renders.
		typeof window !== 'undefined' && window.RocketChatDesktop ? 'rgba(38, 40, 44, 0.85)' : 'rgba(44, 46, 50, 0.55)'
	} !important;
}
.rcx-tile {
	-webkit-backdrop-filter: blur(80px);
	backdrop-filter: blur(80px);
}
/* modals are large reading surfaces over unpredictable content — steadier
   ground than the transient menus/popovers */
.rcx-modal {
	--rcx-color-surface-light: rgba(44, 46, 50, 0.92);
}
/* inputs sit at T1 (#212224, the chrome tone), never at the overlay tone;
   the doubled class beats the Box backgroundColor prop's css-in-js rule
   (also !important) regardless of stylesheet order, and some inputs
   (navbar search) live outside #rocket-chat */
:root {
	--rcx-input-colors-background-color: #212224;
	/* fill-led fields (design memo): inputs are recessed wells cut into the
	   surface — T-1 (#101113) is the single sanctioned tone below the
	   anchor, reserved for form-field fills. Strokes are decorative
	   whispers (WCAG 1.4.11 carve-out — identification comes from
	   placeholder/icon/fill); the solid stroke-highlight focus border is
	   the one load-bearing ring (5.6:1), so the 2px focus halo goes to
	   keep a single outline. */
	--rcx-input-colors-background-color: rgba(0, 0, 0, 0.35);
	--rcx-input-colors-disabled-background-color: rgba(0, 0, 0, 0.35);
	--rcx-input-colors-border-color: rgba(255, 255, 255, 0.08);
	--rcx-input-colors-hover-border-color: rgba(255, 255, 255, 0.16);
	--rcx-input-colors-active-border-color: rgba(255, 255, 255, 0.16);
	--rcx-input-colors-disabled-border-color: transparent;
	--rcx-input-colors-focus-shadow-color: transparent;
}
.rcx-input-box__wrapper.rcx-input-box__wrapper {
	background-color: rgba(0, 0, 0, 0.35) !important;
}
/* the inset sells the "cut into" depth that lets an 8% border suffice —
   part of the field recipe (fill + stroke + inset), forbidden elsewhere */
.rcx-input-box__wrapper.rcx-input-box__wrapper:not(:focus-within) {
	box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.25);
}
/* workspace watermark: a fixed pseudo-element with its own opacity, so it
   layers between the translucent anchor and the content without an opaque
   dim layer (which would block the window vibrancy). Inline style tag —
   the custom-css endpoint is MIME-refused inside the desktop webview. */
body::before {
	content: '';
	position: fixed;
	inset: 0;
	z-index: 0;
	pointer-events: none;
	background: url('https://commons.wikimedia.org/wiki/Special:FilePath/Seal_of_the_Central_Intelligence_Agency.svg?width=480')
		center / 480px no-repeat;
	opacity: 0.12;
}
/* alpha veils are not idempotent: exactly ONE painter per region. The
   app-level sidebar wrapper Box paints the T1 veil once; every nested
   Fuselage element that repaints surface-sidebar goes transparent. */
.rcx-sidebar--main.rcx-sidebar--main,
.rcx-sidebar-v2-collapse-group__bar,
.rcx-sidebar-v2-footer {
	background-color: transparent !important;
}`;

export const MainLayoutStyleTags = () => {
	const theme = useThemeMode();

	return (
		<>
			<PaletteStyleTag theme={theme} selector='.rcx-content--main, .rcx-tile' tagId={`main-palette-${theme}`} />
			<PaletteStyleTag
				theme={theme === 'dark-alpha' ? 'dark-alpha' : 'dark'}
				selector='.rcx-sidebar--main, .rcx-sidebar-rail, .rcx-sidepanel, .rcx-navbar'
				tagId='sidebar-palette'
			/>
			{(theme === 'dark' || theme === 'dark-alpha') && (
				<PaletteStyleTag selector='.rcx-content--main' palette={codeBlock} tagId='codeBlock-palette' />
			)}
			{theme === 'dark-alpha' && <PaletteStyleTag palette={darkAlphaShell} tagId='darkAlphaShell-palette' />}
		</>
	);
};
