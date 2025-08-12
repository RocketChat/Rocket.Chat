import colorTokens from '@rocket.chat/fuselage-tokens/colors.json';
import type { Meta, StoryFn } from '@storybook/react';
import type { ComponentProps } from 'react';

import UsagePieGraph from './UsagePieGraph';
import { useAutoSequence } from '../../../../stories/hooks/useAutoSequence';

export default {
	title: 'Admin/Info/UsagePieGraph',
	component: UsagePieGraph,
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof UsagePieGraph>;

const Template: StoryFn<typeof UsagePieGraph> = (args) => <UsagePieGraph {...args} />;

export const Example = Template.bind({});
Example.args = {
	total: 321,
	used: 123,
	size: 128,
	label: 'Example label',
	color: colorTokens.p500,
};

export const Unlimited = Template.bind({});
Unlimited.args = {
	used: 123,
	size: 128,
	label: 'Example label',
	color: colorTokens.p500,
};

export const Animated: StoryFn<Pick<ComponentProps<typeof UsagePieGraph>, 'size' | 'label'>> = (args) => {
	const props = useAutoSequence([
		{
			total: 100,
			used: 0,
			color: colorTokens.g500,
		},
		{
			total: 100,
			used: 25,
			color: colorTokens.b500,
		},
		{
			total: 100,
			used: 50,
			color: colorTokens.y500,
		},
		{
			total: 100,
			used: 75,
			color: colorTokens.o500,
		},
		{
			total: 100,
			used: 100,
			color: colorTokens.r500,
		},
	]);

	return <UsagePieGraph {...props} {...args} />;
};
Animated.args = {
	size: 128,
	label: 'Example label',
};
