import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

type CollapsibleRegionProps = {
	children: ReactNode;
	expanded?: boolean;
} & ComponentProps<typeof Box>;

export const CollapsibleRegion = ({ children, expanded, ...props }: CollapsibleRegionProps) => {
	return (
		<Box {...props} maxHeight={expanded ? 'fit-content' : 0} style={{ transition: 'all 0.18s ease', overflowY: 'hidden' }} is='dd'>
			<Box role='region'>{children}</Box>
		</Box>
	);
};
