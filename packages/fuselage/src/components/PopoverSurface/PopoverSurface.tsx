import type { HTMLAttributes, RefAttributes } from 'react';

import { Box } from '../Box';

export type PopoverSurfaceProps = Omit<HTMLAttributes<HTMLElement>, 'color' | 'is'> &
	RefAttributes<HTMLElement> & {
		/** Caps the height at a share of the viewport; the content scrolls past it. */
		maxHeight?: 'half-screen' | 'most-of-screen';
		/** Drops the block padding, for content that reaches the surface's edges. */
		flush?: boolean;
	};

const maxHeights = { 'half-screen': '50vh', 'most-of-screen': '80vh' } as const;

/**
 * The raised surface of a dropdown or popover: it fills its positioner and scrolls its content.
 */
function PopoverSurface({ maxHeight, flush, ...props }: PopoverSurfaceProps) {
	return (
		<Box
			rcx-tile
			rcx-tile--elevation='2'
			display='flex'
			flexDirection='column'
			overflow='auto'
			paddingBlock={flush ? undefined : 12}
			maxHeight={maxHeight && maxHeights[maxHeight]}
			{...props}
		/>
	);
}

export default PopoverSurface;
