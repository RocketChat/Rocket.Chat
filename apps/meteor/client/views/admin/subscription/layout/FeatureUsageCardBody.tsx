import { Box, CardBody } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type FeatureUsageCardBodyProps = { justifyContent?: 'flex-start' | 'center'; children: ReactNode };

/**
 * The body of a feature usage card, its content in a centred column that fills the card.
 */
const FeatureUsageCardBody = ({ justifyContent = 'center', children }: FeatureUsageCardBodyProps) => (
	<CardBody>
		<Box height='full' width='full' display='flex' alignItems='center' justifyContent={justifyContent} flexDirection='column'>
			{children}
		</Box>
	</CardBody>
);

export default FeatureUsageCardBody;
