import type { Meta, StoryFn } from '@storybook/react';

import ReturnChatQueueModal from './ReturnChatQueueModal';

export default {
	component: ReturnChatQueueModal,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	args: {
		onMoveChat: () => undefined,
		onCancel: () => undefined,
	},
} satisfies Meta<typeof ReturnChatQueueModal>;

export const Default: StoryFn<typeof ReturnChatQueueModal> = (args) => <ReturnChatQueueModal {...args} />;
