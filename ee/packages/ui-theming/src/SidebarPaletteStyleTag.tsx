import type { ReactElement } from 'react';
import React, { memo } from 'react';
import { createPortal } from 'react-dom';

import { sidebarPaletteDark } from './sidebarPaletteDark';
import { defaultSidebarPalette } from './sidebarPalette';
import { darkPalette } from './paletteDark';
import { filterOnlyChangedColors } from './filterOnlyChangedColors';
import { convertToCss } from './convertToCss';
import { useThemeMode } from './hooks/useThemeMode';

export const SidebarPaletteStyleTag = memo((): ReactElement | null => {
	const [, , theme] = useThemeMode();

	return createPortal(
		<style id='sidebar-palette' data-style={theme}>
			{convertToCss(
				theme === 'dark' ? filterOnlyChangedColors(darkPalette, sidebarPaletteDark) : { ...darkPalette, ...defaultSidebarPalette },
				'.rcx-sidebar--main',
			)}
		</style>,
		document.head,
	);
});
