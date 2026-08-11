import { css } from '@rocket.chat/css-in-js';
import type { BoxProps } from '@rocket.chat/fuselage';
import { Box, Palette } from '@rocket.chat/fuselage';
import type { RefAttributes } from 'react';
import { memo } from 'react';

import 'overlayscrollbars/styles/overlayscrollbars.css';

export const getScrollbarsOptions = (overflowX?: boolean) =>
	({
		scrollbars: { autoHide: 'move' },
		overflow: { x: overflowX ? 'scroll' : 'hidden' },
	}) as const;

export type BaseScrollbarsProps = BoxProps & RefAttributes<HTMLElement>;

const BaseScrollbars = ({ ref, ...props }: BaseScrollbarsProps) => {
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
};

export default memo(BaseScrollbars);
