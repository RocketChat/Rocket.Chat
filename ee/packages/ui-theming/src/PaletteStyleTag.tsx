import type { ReactElement } from 'react';
import { memo } from 'react';
import { createPortal } from 'react-dom';

import { convertToCss } from './helpers/convertToCss';
import { filterOnlyChangedColors } from './helpers/filterOnlyChangedColors';
import { defaultPalette } from './palette';
import { darkPalette } from './paletteDark';
import { paletteHighContrast } from './paletteHighContrast';
import { useThemeMode } from './hooks/useThemeMode';
import { useCreateStyleContainer } from './hooks/useCreateStyleContainer';

export const PaletteStyleTag = memo((): ReactElement | null => {
	const [, , theme] = useThemeMode();

	const getPalette = () => {
		if (theme === 'dark') {
			return darkPalette;
		}
		if (theme === 'high-contrast') {
			return paletteHighContrast;
		}
		return {};
	};
	const palette = convertToCss(filterOnlyChangedColors(defaultPalette, getPalette()), '.rcx-content--main');

	return createPortal(palette, useCreateStyleContainer('main-palette'));
});
