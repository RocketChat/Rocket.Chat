import type { ReactElement } from 'react';
import React from 'react';
import { createPortal } from 'react-dom';
import { useSessionStorage } from '@rocket.chat/fuselage-hooks';

import { convertToCss } from './convertToCss';
import { filterOnlyChangedColors } from './filterOnlyChangedColors';
import { defaultPalette } from './palette';
import { darkPalette } from './paletteDark';

export const PaletteStyleTag = (): ReactElement | null => {
	const [theme] = useSessionStorage<'dark' | 'light'>(`rcx-theme`, 'light');

	if (theme !== 'dark') {
		return null;
	}

	return createPortal(<style>{convertToCss(filterOnlyChangedColors(defaultPalette, darkPalette))}</style>, document.head);
};
