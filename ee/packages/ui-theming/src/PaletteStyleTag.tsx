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

	return createPortal(<style>{convertToCss(filterOnlyChangedColors(defaultPalette, darkPalette))}</style>, document.head);
};
