import { Box, ProgressBar } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import React from 'react';

const GenericResourceUsage = ({
	title,
	value,
	max,
	percentage,
	threshold = 80,
	variant = percentage < threshold ? 'success' : 'danger',
	subTitle,
	...props
}: {
	title: string;
	subTitle?: ReactNode;
	value: number;
	max: number;
	percentage: number;
	threshold?: number;
	variant?: 'warning' | 'danger' | 'success';
}) => {
	return (
		<Box w='x180' h='x40' mi={8} fontScale='c1' display='flex' flexDirection='column' justifyContent='space-around' {...props}>
			<Box display='flex' justifyContent='space-between'>
				<Box color='default'>{title}</Box>
				{subTitle && <Box color='hint'>{subTitle}</Box>}
				<Box color='hint'>
					{value}/{max}
				</Box>
			</Box>
			<ProgressBar percentage={percentage} variant={variant} />
		</Box>
	);
};

export default GenericResourceUsage;
