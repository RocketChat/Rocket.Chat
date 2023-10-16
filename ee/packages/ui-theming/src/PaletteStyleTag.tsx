import { memo } from 'react';
import { createPortal } from 'react-dom';

import { codeBlock } from './codeBlockStyles';
import { convertToCss } from './helpers/convertToCss';
import { useCreateStyleContainer } from './hooks/useCreateStyleContainer';
import { useThemeMode } from './hooks/useThemeMode';
import { defaultPalette } from './palette';
import { darkPalette } from './paletteDark';
import { paletteHighContrast } from './paletteHighContrast';

export const PaletteStyleTag = memo(function PaletteStyleTag() {
	const [, , theme] = useThemeMode();

	const getPalette = () => {
		if (theme === 'dark') {
			return darkPalette;
		}
		if (theme === 'high-contrast') {
			return paletteHighContrast;
		}
		return defaultPalette;
	};
	const palette = convertToCss(getPalette(), '.rcx-content--main, .rcx-tile');

	return createPortal(theme === 'dark' ? palette + codeBlock : palette, useCreateStyleContainer('main-palette'));
});
