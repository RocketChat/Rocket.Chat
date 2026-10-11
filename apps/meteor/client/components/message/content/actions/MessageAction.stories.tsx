import type { StoryObj, Meta } from '@storybook/react';
import { action } from 'storybook/actions';

import MessageAction from './MessageAction';

export default {
	component: MessageAction,
	args: {
		runAction: (_action: string) => action(_action),
	},
} satisfies Meta<typeof MessageAction>;

export const Example: StoryObj<typeof MessageAction> = {
	args: {
		icon: 'quote' as const,
		i18nLabel: 'Quote' as const,
		methodId: 'method-id',
	},
};
