import { Box, Skeleton, Margins } from '@rocket.chat/fuselage';
import type { FC } from 'react';
import React from 'react';

const AccordionLoading: FC = () => (
	<Box w='full' alignSelf='center'>
		<Margins block='x2'>
			<Skeleton variant='rect' width='100%' height='x80' />
			<Skeleton variant='rect' width='100%' height='x80' />
			<Skeleton variant='rect' width='100%' height='x80' />
		</Margins>
	</Box>
);

export default AccordionLoading;
