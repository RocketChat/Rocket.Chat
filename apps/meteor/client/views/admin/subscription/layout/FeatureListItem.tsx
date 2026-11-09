import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type FeatureListItemProps = {
	twoColumns: boolean;
	icon: ReactNode;
	action?: ReactNode;
	children: ReactNode;
};

/**
 * A plan feature: its status icon, its name, and an optional action after the name.
 */
const FeatureListItem = ({ twoColumns, icon, action, children }: FeatureListItemProps) => (
	<Box is='li' display='flex' alignItems='center' marginBlockEnd='x4' width={twoColumns ? '50%' : 'full'}>
		{icon}
		<Box marginInlineStart='x12' marginInlineEnd='x4'>
			{children}
		</Box>
		{action}
	</Box>
);

export default FeatureListItem;
