import type { ReactElement } from 'react';
import { memo } from 'react';
import { createPortal } from 'react-dom';

import { convertToCss } from './helpers/convertToCss';
import { filterOnlyChangedColors } from './helpers/filterOnlyChangedColors';
import { defaultPalette } from './palette';
import { darkPalette } from './paletteDark';
import { useThemeMode } from './hooks/useThemeMode';
import { createStyleContainer } from './helpers/createStyleContainer';

export const PaletteStyleTag = memo((): ReactElement | null => {
	const [, , theme] = useThemeMode();

	if (theme !== 'dark') {
		return null;
	}
	const palette = convertToCss(filterOnlyChangedColors(defaultPalette, darkPalette), '.rcx-content--main');

	return createPortal(palette, createStyleContainer('main-palette'));
});
