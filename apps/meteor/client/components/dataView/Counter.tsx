import { Box, Flex, Margins } from '@rocket.chat/fuselage';
import type { ReactElement, ReactNode } from 'react';
import React from 'react';

import Growth from './Growth';

type CounterProps = {
	count: ReactNode;
	variation?: number;
	description?: ReactNode;
};

const Counter = ({ count, variation = 0, description }: CounterProps): ReactElement => (
	<>
		<Flex.Container alignItems='end'>
			<Box>
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
		</Flex.Container>
		<Margins block='x12'>
			<Flex.Container alignItems='center'>
				<Box fontScale='p2' color='hint'>
					{description}
				</Box>
			</Flex.Container>
		</Margins>
	</>
);

export default Counter;
