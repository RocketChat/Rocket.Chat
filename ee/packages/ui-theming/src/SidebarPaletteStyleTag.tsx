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

	const customCssElement = document.getElementById('css-theme');
	const styleElement = document.createElement('style');
	styleElement.setAttribute('id', 'sidebar-palette');
	document.head.insertBefore(styleElement, customCssElement);

	const palette = convertToCss(
		theme === 'dark' ? filterOnlyChangedColors(darkPalette, sidebarPaletteDark) : { ...darkPalette, ...defaultSidebarPalette },
		'.rcx-sidebar--main',
	);

	return createPortal(palette, document.getElementById('sidebar-palette') || document.head);
});
