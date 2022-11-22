import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import ResultMessage from './ResultMessage';

export default {
	title: 'Unreads/components/body/ResultMessage',
	component: ResultMessage,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [(fn) => <VerticalBar height='100vh'>{fn()}</VerticalBar>],
} as ComponentMeta<typeof ResultMessage>;

const Template: ComponentStory<typeof ResultMessage> = (args) => <ResultMessage {...args} />;

export const Default = Template.bind({});

Default.args = {
	empty: true,
};

export const Error = Template.bind({});

Error.args = {
	empty: false,
};
