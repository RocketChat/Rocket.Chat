import type { Meta, StoryFn } from '@storybook/react';

import CreateDiscussion from './CreateDiscussion';

export default {
	component: CreateDiscussion,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
} satisfies Meta<typeof CreateDiscussion>;

export const Default: StoryFn<typeof CreateDiscussion> = (args) => <CreateDiscussion {...args} />;
