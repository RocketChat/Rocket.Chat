import colorTokens from '@rocket.chat/fuselage-tokens/colors.json';
import type { ComponentMeta, ComponentStory, Story } from '@storybook/react';
import type { ComponentProps } from 'react';
import React from 'react';

import { useAutoSequence } from '../../../stories/hooks/useAutoSequence';
import UsagePieGraph from './UsagePieGraph';

export default {
	title: 'Admin/Info/UsagePieGraph',
	component: UsagePieGraph,
	parameters: {
		layout: 'centered',
	},
} as ComponentMeta<typeof UsagePieGraph>;

const Template: ComponentStory<typeof UsagePieGraph> = (args) => <UsagePieGraph {...args} />;

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

export const Animated: Story<Pick<ComponentProps<typeof UsagePieGraph>, 'size' | 'label'>> = (args) => {
	const props = useAutoSequence([
		{
			total: 100,
			used: 0,
			color: colorTokens.s500,
		},
		{
			total: 100,
			used: 25,
			color: colorTokens.p500,
		},
		{
			total: 100,
			used: 50,
			color: colorTokens.w500,
		},
		{
			total: 100,
			used: 75,
			color: colorTokens['s1-500'],
		},
		{
			total: 100,
			used: 100,
			color: colorTokens.d500,
		},
	]);

	return <UsagePieGraph {...props} {...args} />;
};
Animated.args = {
	size: 128,
	label: 'Example label',
};
