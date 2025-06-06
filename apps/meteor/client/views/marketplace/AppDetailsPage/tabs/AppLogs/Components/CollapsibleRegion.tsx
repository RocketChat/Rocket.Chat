import { Box } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';

type CollapsibleRegionProps = {
	children: ReactNode;
	_id: string;
	expanded?: boolean;
} & ComponentProps<typeof Box>;

export const CollapsibleRegion = ({ _id, children, expanded, ...props }: CollapsibleRegionProps) => {
	return (
		<Box {...props} id={_id} maxHeight={expanded ? 'fit-content' : 0} style={{ transition: 'all 0.18s ease', overflowY: 'hidden' }} is='dd'>
			<Box aria-labelledby={_id} role='region'>
				{children}
			</Box>
		</Box>
	);
};
