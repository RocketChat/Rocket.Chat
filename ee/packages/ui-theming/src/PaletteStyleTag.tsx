import type { ReactElement } from 'react';
import React from 'react';
import { createPortal } from 'react-dom';

import { convertToCss } from './convertToCss';
import { filterOnlyChangedColors } from './filterOnlyChangedColors';
import { defaultPalette } from './palette';
import { darkPalette } from './paletteDark';
import { useThemeMode } from './hooks/useThemeMode';

export const PaletteStyleTag = (): ReactElement | null => {
	const [, , theme] = useThemeMode();

	if (theme !== 'dark') {
		return null;
	}

	const customCssElement = document.getElementById('css-theme');
	const styleElement = document.createElement('style');
	styleElement.setAttribute('id', 'main-palette');
	document.head.insertBefore(styleElement, customCssElement);

	const palette = convertToCss(filterOnlyChangedColors(defaultPalette, darkPalette), '.rcx-content--main');

	return createPortal(palette, document.getElementById('main-palette') || document.head);
};
