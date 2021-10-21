import { Box, Margins } from '@rocket.chat/fuselage';
import React, { FC } from 'react';

import Growth from './Growth';

export interface ICounter {
	count: number;
	variation: number;
	description: string;
}

const Counter: FC<ICounter> = ({ count, variation = 0, description }) => (
	<>
		<Box display='flex' alignItems='end'>
			<Box>
				<Box
					is='span'
					color='default'
					fontScale='h1'
					style={{
						fontSize: '3em',
						lineHeight: 1,
					}}
				>
					{count}
				</Box>
				<Growth fontScale='s1'>{variation}</Growth>
			</Box>
		</Box>
		<Margins block='x12'>
			<Box display='flex' alignItems='center'>
				<Box fontScale='p1' color='hint'>
					{description}
				</Box>
			</Box>
		</Margins>
	</>
);

export default Counter;
