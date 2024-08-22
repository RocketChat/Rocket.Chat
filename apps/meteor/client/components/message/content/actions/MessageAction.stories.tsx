import { action } from '@storybook/addon-actions';
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import MessageAction from './MessageAction';

export default {
	title: 'components/message/content/actions/MessageAction',
	component: MessageAction,
	args: {
		runAction: (_action: string) => action(_action),
	},
} as ComponentMeta<typeof MessageAction>;

export const Example: ComponentStory<typeof MessageAction> = (args) => <MessageAction {...args} />;
Example.args = {
	icon: 'quote' as const,
	i18nLabel: 'Quote' as const,
	methodId: 'method-id',
};
