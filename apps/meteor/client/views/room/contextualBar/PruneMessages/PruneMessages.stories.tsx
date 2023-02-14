import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import PruneMessages from './PruneMessages';

export default {
	title: 'Room/Contextual Bar/PruneMessages',
	component: PruneMessages,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [(fn) => <VerticalBar height='100vh'>{fn()}</VerticalBar>],
} as ComponentMeta<typeof PruneMessages>;

const Template: ComponentStory<typeof PruneMessages> = (args) => <PruneMessages {...args} />;

export const Default = Template.bind({});

export const WithCallout = Template.bind({});
WithCallout.args = {
	values: { pinned: true },
	callOutText: 'This is a callout',
};
