import { Box } from '@rocket.chat/fuselage';
import type { StoryObj, Meta } from '@storybook/react';

import MessageRoles from './MessageRoles';

export default {
	component: MessageRoles,
	decorators: [(fn) => <Box>{fn()}</Box>], // TODO: workaround for missing Fuselage default stylesheet
} satisfies Meta<typeof MessageRoles>;

export const AdministratorExample: StoryObj<typeof MessageRoles> = {
	args: {
		workspaceRoles: ['Admin', 'Livechat Manager', 'Auditor'],
		roomRoles: ['Owner', 'Leader'],
	},
};

export const BotExample: StoryObj<typeof MessageRoles> = {
	args: {
		workspaceRoles: [],
		roomRoles: [],
		isBot: true,
	},
};
