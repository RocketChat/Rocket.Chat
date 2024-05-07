import { Box } from '@rocket.chat/fuselage';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import MessageRoles from './MessageRoles';

export default {
	title: 'components/message/header/MessageRoles',
	component: MessageRoles,
	decorators: [(fn) => <Box>{fn()}</Box>], // TODO: workaround for missing Fuselage default stylesheet
} as ComponentMeta<typeof MessageRoles>;

export const AdministratorExample: ComponentStory<typeof MessageRoles> = (args) => <MessageRoles {...args} />;
AdministratorExample.args = {
	roles: ['admin', 'user'],
};

export const BotExample: ComponentStory<typeof MessageRoles> = (args) => <MessageRoles {...args} />;
BotExample.args = {
	roles: ['user'],
	isBot: true,
};
