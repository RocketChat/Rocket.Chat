import { Box } from '@rocket.chat/fuselage';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import CannedResponse from './CannedResponse';

export default {
	title: 'Enterprise/Omnichannel/CannedResponseList',
	component: CannedResponse,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
} as ComponentMeta<typeof CannedResponse>;

export const Default: ComponentStory<typeof CannedResponse> = (args) => <CannedResponse {...args} />;
Default.storyName = 'CannedResponse';
Default.args = {
	canEdit: true,
	data: {
		shortcut: 'test3 long long long long long long long long long',
		text: 'simple canned response test3 long long long long long long long long long long long long long long long longlong long long long long long longlong long long long long long longlong long long long long long longlong long long long long long longlong long long long long long longlong long long long long long long',
		scope: 'Customer Support long long long long long long long long long long',
		tags: ['sales', 'support', 'long', 'long', 'long', 'long', 'long', 'long', 'long', 'long'],
		departmentName: '',
	},
};

Default.decorators = [
	(fn) => (
		<Box h='600px' w='330px'>
			{fn()}
		</Box>
	),
];
