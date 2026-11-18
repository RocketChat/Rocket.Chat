import type { HTMLAttributes, RefAttributes } from 'react';

import { Box } from '../Box';

export type PopoverSurfaceProps = Omit<HTMLAttributes<HTMLElement>, 'color' | 'is'> &
	RefAttributes<HTMLElement> & {
		/**
		 * Caps the height at half (`half-screen`) or 80% (`most-of-screen`) of the viewport, and the content scrolls past
		 * it. Without it the surface grows with its content.
		 */
		maxHeight?: 'half-screen' | 'most-of-screen';
		/** Drops the padding above and below the content, for content that reaches the surface's edges. */
		flush?: boolean;
		/** How far the surface is raised above the page. */
		elevation?: '1' | '2';
	};

const maxHeights = { 'half-screen': '50vh', 'most-of-screen': '80vh' } as const;

/**
 * The raised surface of a dropdown or popover: it fills its positioner and scrolls its content.
 */
function PopoverSurface({ maxHeight, flush, elevation = '2', ...props }: PopoverSurfaceProps) {
	return (
		<Box
			rcx-tile
			rcx-tile--elevation={elevation}
			rcx-tile--flush
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
