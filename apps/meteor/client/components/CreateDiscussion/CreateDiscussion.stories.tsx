import type { StoryObj, Meta } from '@storybook/react';

import CreateDiscussion from './CreateDiscussion';

export default {
	component: CreateDiscussion,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	args: {
		onClose: () => undefined,
	},
} satisfies Meta<typeof CreateDiscussion>;

export const Default: StoryObj<typeof CreateDiscussion> = {};
