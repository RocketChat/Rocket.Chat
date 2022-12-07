import type { ReactElement } from 'react';
import React from 'react';
import { createPortal } from 'react-dom';
import { useSessionStorage } from '@rocket.chat/fuselage-hooks';
import { sidebarConvertToCss } from '@rocket.chat/ui-theming/src/sidebarConvertToCss';
import { sidebarPaletteDark } from '@rocket.chat/ui-theming/src/sidebarPaletteDark';
import { defaultSidebarPalette } from '@rocket.chat/ui-theming/src/sidebarPalette';

import { darkPalette } from './paletteDark';
import { convertToCss } from './convertToCss';

export const PaletteStyleTag = (): ReactElement | null => {
	const [theme] = useSessionStorage<'dark' | 'light'>(`rcx-theme`, 'light');

	return createPortal(
		<style id='sidebar-palette' data-style={theme}>
			{convertToCss(darkPalette, '.sidebar--main.sidebar')}
			{sidebarConvertToCss(theme !== 'dark' ? defaultSidebarPalette : sidebarPaletteDark, '.sidebar--main.sidebar')}
		</style>,
		document.head,
	);
};
