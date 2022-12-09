import type { ReactElement } from 'react';
import React, { memo } from 'react';
import { createPortal } from 'react-dom';
import { useSessionStorage } from '@rocket.chat/fuselage-hooks';

import { sidebarPaletteDark } from './sidebarPaletteDark';
import { defaultSidebarPalette } from './sidebarPalette';
import { darkPalette } from './paletteDark';
import { filterOnlyChangedColors } from './filterOnlyChangedColors';
import { convertToCss } from './convertToCss';

export const SidebarPaletteStyleTag = memo((): ReactElement | null => {
	const [theme] = useSessionStorage<'dark' | 'light'>(`rcx-theme`, 'light');

	return createPortal(
		<style id='sidebar-palette' data-style={theme}>
			{convertToCss(
				theme === 'dark' ? filterOnlyChangedColors(darkPalette, sidebarPaletteDark) : { ...darkPalette, ...defaultSidebarPalette },
				'.sidebar--main.sidebar',
			)}
		</style>,
		document.head,
	);
});
