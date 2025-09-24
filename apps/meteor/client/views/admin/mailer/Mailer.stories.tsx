import type { Meta, StoryFn } from '@storybook/react';

import MailerPage from './MailerPage';

export default {
	component: MailerPage,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof MailerPage>;

export const Default: StoryFn<typeof MailerPage> = () => <MailerPage />;
Default.storyName = 'Mailer';
