import type { CSSProperties, ReactNode, RefAttributes } from 'react';

import { Box } from '../Box';
import { PopoverSurface, type PopoverSurfaceProps } from '../PopoverSurface';

export type DropdownDesktopProps = RefAttributes<HTMLElement> & {
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
