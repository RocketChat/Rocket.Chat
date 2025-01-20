import type { Meta, StoryFn } from '@storybook/react';

import NotAuthorizedPage from './NotAuthorizedPage';

export default {
	title: 'Not Authorized/NotAuthorizedPage',
	component: NotAuthorizedPage,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof NotAuthorizedPage>;

export const Default: StoryFn<typeof NotAuthorizedPage> = () => <NotAuthorizedPage />;
Default.storyName = 'NotAuthorizedPage';
