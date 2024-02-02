import { Skeleton } from '@rocket.chat/fuselage';
import React from 'react';

const SKELETON_ITEMS = 3;

const AccordionLoading = () => (
	<>
		{Array.from({ length: SKELETON_ITEMS }, (_v, k) => (
			<Skeleton key={k} variant='rect' height='80px' m='2px' />
		))}
	</>
);

export default AccordionLoading;
