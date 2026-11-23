import type { CSSProperties, HTMLAttributes, ReactNode, RefAttributes } from 'react';

import { Box } from '../Box/index.js';
import { PopoverSurface, type PopoverSurfaceProps } from '../PopoverSurface/index.js';

export type DropdownDesktopProps = Omit<HTMLAttributes<HTMLElement>, 'children' | 'style' | 'color'> &
	RefAttributes<HTMLElement> & {
		children: ReactNode;
		maxHeight?: PopoverSurfaceProps['maxHeight'];
		style?: CSSProperties;
	};

export function DropdownDesktop({ children, style, ...props }: DropdownDesktopProps) {
	return (
		<PopoverSurface style={style} data-testid='dropdown' {...props}>
			<Box>{style?.visibility === 'hidden' ? null : children}</Box>
		</PopoverSurface>
	);
}
