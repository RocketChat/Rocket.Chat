import { memo } from 'react';
import { createPortal } from 'react-dom';

import { convertToCss } from './helpers/convertToCss';
import { filterOnlyChangedColors } from './helpers/filterOnlyChangedColors';
import { useCreateStyleContainer } from './hooks/useCreateStyleContainer';
import { useThemeMode } from './hooks/useThemeMode';
import { defaultPalette } from './palette';
import { darkPalette } from './paletteDark';

export const PaletteStyleTag = memo(function PaletteStyleTag() {
	const [, , theme] = useThemeMode();

	const palette =
		theme === 'dark'
			? convertToCss(filterOnlyChangedColors(defaultPalette, darkPalette), '.rcx-content--main')
			: convertToCss(filterOnlyChangedColors(defaultPalette, {}), '.rcx-content--main');

	return createPortal(palette, useCreateStyleContainer('main-palette'));
});
