import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import Growth from './Growth';

export type CounterProps = {
	count: ReactNode;
	variation?: number;
	description?: ReactNode;
};

const Counter = ({ count, variation = 0, description }: CounterProps) => (
	<>
		<Box display='flex' alignItems='flex-end'>
			<Box
				is='span'
				color='default'
				fontScale='h2'
				style={{
					fontSize: '3em',
					lineHeight: 1,
				}}
			>
				{count}
			</Box>
			<Growth fontScale='h4'>{variation}</Growth>
		</Box>
		<Box display='flex' alignItems='center' marginBlock={12} fontScale='p2' color='hint'>
			{description}
		</Box>
	</>
);

export default Counter;
