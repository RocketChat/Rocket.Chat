import { Box, Stack } from '@rocket.chat/fuselage';
import { Children } from 'react';
import type { ReactNode } from 'react';

type ApiReferenceProps = {
	title: ReactNode;
	children: ReactNode;
};

/**
 * The list of the endpoints an app exposes, under its title, each endpoint's sample requests in the normal text flow.
 */
const ApiReference = ({ title, children }: ApiReferenceProps) => (
	<Box paddingBlockStart='x12' paddingBlockEnd='x8'>
		<Stack gap='x20'>
			{title}
			<Stack gap='x16'>
				{Children.map(children, (endpoint) => (
					<Box>{endpoint}</Box>
				))}
			</Stack>
		</Stack>
	</Box>
);

export default ApiReference;
