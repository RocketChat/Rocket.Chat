import { Box } from '@rocket.chat/fuselage';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import { useAutoSequence } from '../../stories/hooks/useAutoSequence';
import Growth from './Growth';

export default {
	title: 'Components/Data/Growth',
	component: Growth,
	parameters: {
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
	},
} as ComponentMeta<typeof Growth>;

export const Example: ComponentStory<typeof Growth> = () => {
	const value = useAutoSequence([3, -2, 1, -1, 2, -3]);

	return <Growth>{value}</Growth>;
};

export const Positive: ComponentStory<typeof Growth> = () => <Growth>{3}</Growth>;

export const Zero: ComponentStory<typeof Growth> = () => <Growth>{0}</Growth>;

export const Negative: ComponentStory<typeof Growth> = () => <Growth>{-3}</Growth>;

export const WithTextStyle: ComponentStory<typeof Growth> = () => (
	<Box display='flex' flexDirection='column' alignItems='center'>
		{(['h2', 'c1', 'micro'] as const).map((fontScale) => (
			<Box key={fontScale}>
				<Growth fontScale={fontScale}>{3}</Growth>
				<Growth fontScale={fontScale}>{-3}</Growth>
			</Box>
		))}
	</Box>
);
