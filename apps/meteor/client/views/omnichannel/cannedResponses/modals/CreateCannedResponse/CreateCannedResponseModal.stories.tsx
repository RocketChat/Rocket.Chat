import type { IOmnichannelCannedResponse } from '@rocket.chat/core-typings';
import { EmojiPickerContext } from '@rocket.chat/ui-emoji-picker';
import type { Meta } from '@storybook/react';
import type { ContextType } from 'react';

import CreateCannedResponseModal from './CreateCannedResponseModal';

const emojiPicker = {
	open: () => undefined,
	isOpen: false,
	close: () => undefined,
} as unknown as ContextType<typeof EmojiPickerContext>;

export default {
	component: CreateCannedResponseModal,
	decorators: [
		(Story) => (
			<EmojiPickerContext.Provider value={emojiPicker}>
				<Story />
			</EmojiPickerContext.Provider>
		),
	],
	parameters: {
		actions: {
			argTypesRegex: '^on.*',
		},
	},
} satisfies Meta<typeof CreateCannedResponseModal>;

export const Default = {};

export const WithMessage = {
	args: {
		cannedResponseData: {
			_id: 'canned-response-1',
			shortcut: 'greeting',
			text: 'Hello {{contact.name}}, how can I help you today?',
			tags: ['support', 'welcome'],
			scope: 'user',
		} as IOmnichannelCannedResponse,
	},
};
