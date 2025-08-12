import type { Meta, StoryFn } from '@storybook/react';

import MailerPage from './MailerPage';

export default {
	title: 'Admin/Mailer/Mailer',
	component: MailerPage,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof MailerPage>;

export const Default: StoryFn<typeof MailerPage> = () => <MailerPage />;
Default.storyName = 'Mailer';
