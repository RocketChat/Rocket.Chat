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
.rcx-tile {
	-webkit-backdrop-filter: blur(16px);
	backdrop-filter: blur(16px);
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
	/* strokes are decorative (WCAG 1.4.11 carve-out): inputs are identified
	   by placeholder/icon/fill, and the focus ring carries the operable
	   duty. Resting shares stroke-light with the global header divider
	   (the original Fuselage pairing); interaction states step up. */
	--rcx-input-colors-border-color: var(--rcx-color-stroke-light);
	--rcx-input-colors-hover-border-color: rgba(255, 255, 255, 0.28);
	--rcx-input-colors-active-border-color: rgba(255, 255, 255, 0.34);
	--rcx-input-colors-disabled-border-color: rgba(255, 255, 255, 0.08);
}
.rcx-input-box__wrapper.rcx-input-box__wrapper {
	background-color: #212224 !important;
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
