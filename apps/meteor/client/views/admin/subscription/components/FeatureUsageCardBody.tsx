import { Box, CardBody } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

export type FeatureUsageCardBodyProps = { justifyContent?: 'flex-start' | 'center'; children: ReactNode };

const FeatureUsageCardBody = ({ justifyContent = 'center', children }: FeatureUsageCardBodyProps) => (
	<CardBody>
		<Box height='full' width='full' display='flex' alignItems='center' justifyContent={justifyContent} flexDirection='column'>
			{children}
		</Box>
	</CardBody>
);

export default FeatureUsageCardBody;
