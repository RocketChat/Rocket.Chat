import { css } from '@rocket.chat/css-in-js';
import type { BoxProps } from '@rocket.chat/fuselage';
import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type CollapsibleRegionProps = {
	children: ReactNode;
	expanded?: boolean;
} & BoxProps;

export const CollapsibleRegion = ({ children, expanded, ...props }: CollapsibleRegionProps) => {
	return (
		<Box
			{...props}
			maxHeight={expanded ? 'fit-content' : 0}
			className={[
				css`
					transition: all 0.18s ease;
				`,
			]}
			overflowY='hidden'
			is='dd'
		>
			<Box role='region'>{children}</Box>
		</Box>
	);
};
