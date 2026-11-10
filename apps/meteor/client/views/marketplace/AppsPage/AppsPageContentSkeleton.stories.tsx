import type { Meta, StoryObj } from '@storybook/react';

import AppsPageContentSkeleton from './AppsPageContentSkeleton';

export default {
	component: AppsPageContentSkeleton,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof AppsPageContentSkeleton>;

export const Default: StoryObj<typeof AppsPageContentSkeleton> = {};
