import { Box } from '@rocket.chat/fuselage';
import type { Meta, StoryFn } from '@storybook/react';

import MessageRoles from './MessageRoles';

export default {
	title: 'components/message/header/MessageRoles',
	component: MessageRoles,
	decorators: [(fn) => <Box>{fn()}</Box>], // TODO: workaround for missing Fuselage default stylesheet
} satisfies Meta<typeof MessageRoles>;

export const AdministratorExample: StoryFn<typeof MessageRoles> = (args) => <MessageRoles {...args} />;
AdministratorExample.args = {
	roles: ['admin', 'user'],
};

export const BotExample: StoryFn<typeof MessageRoles> = (args) => <MessageRoles {...args} />;
BotExample.args = {
	roles: ['user'],
	isBot: true,
};
