import { PaletteStyleTag } from '@rocket.chat/fuselage';
import { useThemeMode } from '@rocket.chat/ui-client';
import { useSetting } from '@rocket.chat/ui-contexts';

import { codeBlock } from '../lib/codeBlockStyles';

// dark-alpha only: the app shell must not paint over <body>, so the body
// background (the theme anchor) shows through the translucent surfaces.
// Elevated surfaces are translucent veils, so they blur whatever sits
// behind them to stay legible over arbitrary content.
const darkAlphaShellBase = `#rocket-chat.menu-nav {
	/* !important to outweigh the Box backgroundColor prop's css-in-js rule */
	background-color: transparent !important;
}
.rcx-tile {
	-webkit-backdrop-filter: blur(16px);
	backdrop-filter: blur(16px);
}
/* modals are large reading surfaces over unpredictable content — steadier
   ground than the transient menus/popovers */
.rcx-modal {
	--rcx-color-surface-light: rgba(44, 46, 50, 0.92);
}
/* input recipe lives on :root because some inputs (navbar search) render
   outside #rocket-chat; the doubled wrapper class below beats the Box
   backgroundColor prop's css-in-js rule (also !important) regardless of
   stylesheet order */
:root {
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
/* alpha veils are not idempotent: exactly ONE painter per region. The
   app-level sidebar wrapper Box paints the T1 veil once; every nested
   Fuselage element that repaints surface-sidebar goes transparent. */
.rcx-sidebar--main.rcx-sidebar--main,
.rcx-sidebar-collapse-group__bar,
.rcx-sidebar-footer {
	background-color: transparent !important;
}`;

// CSS url() string literal: escape what could break out of the quotes
const cssUrl = (url: string) => `url("${url.replace(/[\\"\n\r]/g, (c) => `\\${c.charCodeAt(0).toString(16)} `)}")`;

/* workspace watermark (admin setting): a fixed pseudo-element with its own
   opacity, layered between the anchor and the content — no opaque dim
   layer, so the body anchor still shows through every veil. It goes in
   this inline style tag on purpose: the custom-css endpoint is served as
   text/plain and refused inside webviews. Empty URL = no layer at all. */
const darkAlphaWatermark = (url: string, opacityPercent: number) => `
body::before {
	content: '';
	position: fixed;
	inset: 0;
	z-index: 0;
	pointer-events: none;
	background: ${cssUrl(url)} center / 480px no-repeat;
	opacity: ${Math.min(100, Math.max(0, opacityPercent)) / 100};
}`;

export const MainLayoutStyleTags = () => {
	const theme = useThemeMode();
	const watermarkUrl = useSetting('Layout_Dark_Alpha_Watermark_Url', '').trim();
	const watermarkOpacity = useSetting('Layout_Dark_Alpha_Watermark_Opacity', 12);
	const darkAlphaShell = watermarkUrl ? darkAlphaShellBase + darkAlphaWatermark(watermarkUrl, watermarkOpacity) : darkAlphaShellBase;

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
