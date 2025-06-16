import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import CannedResponse from './CannedResponse';

export default {
	title: 'Omnichannel/CannedResponse',
	component: CannedResponse,
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
} satisfies Meta<typeof CannedResponse>;

export const Default: StoryFn<typeof CannedResponse> = (args) => <CannedResponse {...args} />;
Default.storyName = 'CannedResponse';
Default.args = {
	allowEdit: true,
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
