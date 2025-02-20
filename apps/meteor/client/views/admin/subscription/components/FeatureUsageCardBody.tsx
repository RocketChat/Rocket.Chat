import { Box, CardBody } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type FeatureUsageCardBodyProps = { justifyContent?: 'flex-start' | 'center'; children: ReactNode };

const FeatureUsageCardBody = ({ justifyContent = 'center', children }: FeatureUsageCardBodyProps) => (
	<CardBody>
		<Box h='full' w='full' display='flex' alignItems='center' justifyContent={justifyContent} flexDirection='column'>
			{children}
		</Box>
	</CardBody>
);

export default FeatureUsageCardBody;
