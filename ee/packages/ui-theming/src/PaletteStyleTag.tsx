import type { ReactElement } from 'react';
import { memo } from 'react';
import { createPortal } from 'react-dom';

import { convertToCss } from './convertToCss';
import { filterOnlyChangedColors } from './filterOnlyChangedColors';
import { defaultPalette } from './palette';
import { darkPalette } from './paletteDark';
import { useThemeMode } from './hooks/useThemeMode';
import { useCreateStyleContainer } from './hooks/useCreateStyleContainer';

export const PaletteStyleTag = memo((): ReactElement | null => {
	const [, , theme] = useThemeMode();

	if (theme !== 'dark') {
		return null;
	}
	const palette = convertToCss(filterOnlyChangedColors(defaultPalette, darkPalette), '.rcx-content--main');

	return createPortal(palette, useCreateStyleContainer('main-palette'));
});
