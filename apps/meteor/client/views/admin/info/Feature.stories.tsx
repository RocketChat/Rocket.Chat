import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import Feature from './Feature';

export default {
	title: 'Admin/Info/Feature',
	component: Feature,
	parameters: {
		layout: 'centered',
	},
} as ComponentMeta<typeof Feature>;

const Template: ComponentStory<typeof Feature> = (args) => <Feature {...args} />;

export const Enabled = Template.bind({});
Enabled.args = {
	enabled: true,
	label: 'Awesome feature',
};

export const NotEnabled = Template.bind({});
NotEnabled.args = {
	enabled: false,
	label: 'Awesome feature',
};
