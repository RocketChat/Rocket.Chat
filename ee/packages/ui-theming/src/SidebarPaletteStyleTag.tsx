import type { ReactElement } from 'react';
import React, { memo } from 'react';
import { createPortal } from 'react-dom';

import { convertToCss } from './helpers/convertToCss';
import { useCreateStyleContainer } from './hooks/useCreateStyleContainer';
import { darkPalette } from './paletteDark';

export const SidebarPaletteStyleTag = memo(function SidebarPaletteStyleTag(): ReactElement | null {
	const palette = convertToCss({ ...darkPalette }, '.rcx-sidebar--main');

	return <>{createPortal(palette, useCreateStyleContainer('sidebar-palette'))}</>;
});
