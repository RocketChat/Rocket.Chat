import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { ComponentProps } from 'react';
import { forwardRef, memo } from 'react';

import 'overlayscrollbars/styles/overlayscrollbars.css';

export const getScrollbarsOptions = (overflowX?: boolean) =>
	({
		scrollbars: { autoHide: 'scroll' },
		overflow: { x: overflowX ? 'scroll' : 'hidden' },
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
