import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import TextSeparator from './TextSeparator';

export default {
	title: 'Admin/Info/TextSeparator',
	component: TextSeparator,
	parameters: {
		layout: 'centered',
	},
	decorators: [(fn) => <div style={{ minWidth: 400 }}>{fn()}</div>],
} as ComponentMeta<typeof TextSeparator>;

const Template: ComponentStory<typeof TextSeparator> = (args) => <TextSeparator {...args} />;

export const Default = Template.bind({});
Default.storyName = 'TextSeparator';
Default.args = {
	label: 'Example label',
	value: 'Example value',
};
