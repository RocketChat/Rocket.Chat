import { Box, FlexContainer, Margins } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

import Growth from './Growth';

type CounterProps = {
	count: ReactNode;
	variation?: number;
	description?: ReactNode;
};

const Counter = ({ count, variation = 0, description }: CounterProps) => (
	<>
		<FlexContainer alignItems='end'>
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
		</FlexContainer>
		<Margins block={12}>
			<FlexContainer alignItems='center'>
				<Box fontScale='p2' color='hint'>
					{description}
				</Box>
			</FlexContainer>
		</Margins>
	</>
);

export default Counter;
