import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type FeatureListProps = {
	twoColumns: boolean;
	children: ReactNode;
};

/**
 * The plan features of the features card, in two columns when there is room for them.
 */
const FeatureList = ({ twoColumns, children }: FeatureListProps) => (
	<Box
		is='ul'
		margin='none'
		padding='none'
		display='flex'
		flexWrap='wrap'
		justifyContent='space-between'
		flexDirection={twoColumns ? 'row' : 'column'}
	>
		{children}
	</Box>
);

export default FeatureList;
