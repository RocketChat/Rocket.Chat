import type { ReactElement } from 'react';
import { memo } from 'react';
import { createPortal } from 'react-dom';

import { convertToCss } from './helpers/convertToCss';
import { filterOnlyChangedColors } from './helpers/filterOnlyChangedColors';
import { defaultPalette } from './palette';
import { darkPalette } from './paletteDark';
import { useThemeMode } from './hooks/useThemeMode';
import { useCreateStyleContainer } from './hooks/useCreateStyleContainer';

export const PaletteStyleTag = memo((): ReactElement | null => {
	const [, , theme] = useThemeMode();

	const palette =
		theme === 'dark'
			? convertToCss(filterOnlyChangedColors(defaultPalette, darkPalette), '.rcx-content--main')
			: convertToCss(filterOnlyChangedColors(defaultPalette, {}), '.rcx-content--main');

	return createPortal(palette, useCreateStyleContainer('main-palette'));
});
