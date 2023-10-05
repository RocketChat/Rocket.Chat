import type { ReactElement } from 'react';
import { memo } from 'react';
import { createPortal } from 'react-dom';

import { convertToCss } from './helpers/convertToCss';
import { useCreateStyleContainer } from './hooks/useCreateStyleContainer';
import { darkPalette } from './paletteDark';
import { defaultSidebarPalette } from './sidebarPalette';

export const SidebarPaletteStyleTag = memo(function SidebarPaletteStyleTag(): ReactElement | null {
	// Commented code below: sidebar palette currently the same in both themes.

	// const [, , theme] = useThemeMode();
	// const palette = convertToCss(
	// 	theme === 'dark' ? filterOnlyChangedColors(darkPalette, sidebarPaletteDark) : { ...darkPalette, ...defaultSidebarPalette },
	// 	'.rcx-sidebar--main',
	// );

	const palette = convertToCss({ ...darkPalette, ...defaultSidebarPalette }, '.rcx-sidebar--main');

	return createPortal(palette, useCreateStyleContainer('sidebar-palette'));
});
