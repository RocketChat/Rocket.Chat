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
   the wrapper rule needs !important + specificity because the Box
   backgroundColor prop's css-in-js rule also carries !important */
#rocket-chat,
.rcx-tile {
	--rcx-input-colors-background-color: #212224;
	--rcx-input-colors-border-color: rgba(255, 255, 255, 0.36);
}
#rocket-chat .rcx-input-box__wrapper,
.rcx-tile .rcx-input-box__wrapper {
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
