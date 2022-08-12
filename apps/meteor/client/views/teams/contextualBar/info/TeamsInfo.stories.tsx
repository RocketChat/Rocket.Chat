import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import VerticalBar from '../../../../components/VerticalBar';
import TeamsInfo from './TeamsInfo';

export default {
	title: 'Teams/Contextual Bar/TeamsInfo',
	component: TeamsInfo,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [(fn) => <VerticalBar height='100vh'>{fn()}</VerticalBar>],
	args: {
		fname: 'rocketchat-frontend-team',
		description:
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit libero',
		announcement:
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit libero',
		topic:
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam mollis nisi vel arcu bibendum vehicula. Integer vitae suscipit libero',
		icon: 'lock',
	},
} as ComponentMeta<typeof TeamsInfo>;

const Template: ComponentStory<typeof TeamsInfo> = (args) => <TeamsInfo {...args} />;

export const Default = Template.bind({});

export const Archived = Template.bind({});
Archived.args = {
	archived: true,
};

export const Broadcast = Template.bind({});
Broadcast.args = {
	broadcast: true,
};
