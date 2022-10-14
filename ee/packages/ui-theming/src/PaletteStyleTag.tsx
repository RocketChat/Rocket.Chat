import type { ReactElement } from 'react';
import { createPortal } from 'react-dom';

import { convertToCss } from './convertToCss';
import { filterOnlyChangedColors } from './filterOnlyChangedColors';
import { defaultPalette } from './palette';

export const PaletteStyleTag = ({ palette }: { palette: Record<string, string> }): ReactElement =>
	createPortal(<style>{convertToCss(filterOnlyChangedColors(defaultPalette, palette))}</style>, document.head);
