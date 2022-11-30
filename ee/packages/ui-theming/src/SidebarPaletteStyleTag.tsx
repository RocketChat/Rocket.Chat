import type { ReactElement } from 'react';
import React from 'react';
import { createPortal } from 'react-dom';
import { useSessionStorage } from '@rocket.chat/fuselage-hooks';

import { convertToCss } from '@rocket.chat/ui-theming/src/sidebarConvertToCss';
import { filterOnlyChangedColors } from '@rocket.chat/ui-theming/src/filterOnlyChangedColors';

import { sidebarPaletteDark } from '@rocket.chat/ui-theming/src/sidebarPaletteDark';
import { defaultSidebarPalette } from '@rocket.chat/ui-theming/src/sidebarPalette';

export const PaletteStyleTag = (): ReactElement | null => {
	const [theme] = useSessionStorage<'dark' | 'light'>(`rcx-theme`, 'light');

	if (theme !== 'dark') {
		return null;
	}

	return createPortal(<style>{convertToCss(filterOnlyChangedColors(defaultSidebarPalette, sidebarPaletteDark))}</style>, document.head);
};
