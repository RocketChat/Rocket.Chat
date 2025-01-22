import { action } from '@storybook/addon-actions';
import type { Meta, StoryFn } from '@storybook/react';

import MessageAction from './MessageAction';

export default {
	title: 'components/message/content/actions/MessageAction',
	component: MessageAction,
	args: {
		runAction: (_action: string) => action(_action),
	},
} satisfies Meta<typeof MessageAction>;

export const Example: StoryFn<typeof MessageAction> = (args) => <MessageAction {...args} />;
Example.args = {
	icon: 'quote' as const,
	i18nLabel: 'Quote' as const,
	methodId: 'method-id',
};
