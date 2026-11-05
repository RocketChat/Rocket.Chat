import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

import 'overlayscrollbars/styles/overlayscrollbars.css';

export const getScrollbarsOptions = (overflowX?: boolean) =>
	({
		scrollbars: { autoHide: 'move', autoHideDelay: 800 },
		overflow: { x: overflowX ? 'scroll' : 'hidden' },
		// The library adds another load listener to an image each time its row moves and never removes the old ones,
		// so the avatars of a list that reorders in place, like the sidebar, keep growing in memory.
		// Avatars have a fixed size, so their load never changes the scroll size.
		update: { elementEvents: [['img:not(.rcx-avatar__element)', 'load']] as [string, string][] },
	}) as const;

const BaseScrollbars = forwardRef<HTMLElement, ComponentProps<typeof Box>>(function BaseScrollbars(props, ref) {
	return (
		<Box
			ref={ref}
			height='full'
			width='full'
			className={css`
				.os-scrollbar {
					--os-handle-bg: ${Palette.stroke['stroke-dark']};
					--os-handle-bg-hover: ${Palette.stroke['stroke-dark']};
					--os-handle-bg-active: ${Palette.stroke['stroke-dark']};
				}
			`}
			{...props}
		/>
	);
});

export default memo(BaseScrollbars);
