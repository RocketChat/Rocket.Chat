import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import Growth from './Growth';
import { useAutoSequence } from '../../stories/hooks/useAutoSequence';

export default {
	title: 'Components/Data/Growth',
	component: Growth,
	parameters: {
		layout: 'centered',
		controls: { hideNoControlsWarning: true },
	},
} satisfies Meta<typeof Growth>;

export const Example: StoryFn<typeof Growth> = () => {
	const value = useAutoSequence([3, -2, 1, -1, 2, -3]);

	return <Growth>{value}</Growth>;
};

export const Positive: StoryFn<typeof Growth> = () => <Growth>{3}</Growth>;

export const Zero: StoryFn<typeof Growth> = () => <Growth>{0}</Growth>;

export const Negative: StoryFn<typeof Growth> = () => <Growth>{-3}</Growth>;

export const WithTextStyle: StoryFn<typeof Growth> = () => (
	<Box display='flex' flexDirection='column' alignItems='center'>
		{(['h2', 'c1', 'micro'] as const).map((fontScale) => (
			<Box key={fontScale}>
				<Growth fontScale={fontScale}>{3}</Growth>
				<Growth fontScale={fontScale}>{-3}</Growth>
			</Box>
		))}
	</Box>
);
