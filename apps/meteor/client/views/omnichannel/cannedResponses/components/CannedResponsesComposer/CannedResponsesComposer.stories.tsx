import { EmojiPickerContext } from '@rocket.chat/ui-emoji-picker';
import type { StoryObj, Meta } from '@storybook/react';
import type { ContextType } from 'react';
import { userEvent, within } from 'storybook/test';

import CannedResponsesComposer from './CannedResponsesComposer';

const emojiPicker = {
	open: () => undefined,
	isOpen: false,
	close: () => undefined,
} as unknown as ContextType<typeof EmojiPickerContext>;

export default {
	component: CannedResponsesComposer,
	decorators: [
		(Story) => (
			<EmojiPickerContext.Provider value={emojiPicker}>
				<Story />
			</EmojiPickerContext.Provider>
		),
	],
} satisfies Meta<typeof CannedResponsesComposer>;

export const Default: StoryObj<typeof CannedResponsesComposer> = {
	name: 'CannedResponsesComposer',
};

export const PlaceholderMenuOpen: StoryObj<typeof CannedResponsesComposer> = {
	play: async ({ canvasElement }) => {
		await userEvent.click(await within(canvasElement).findByRole('button', { name: /insert.?placeholder/i }));
	},
};
