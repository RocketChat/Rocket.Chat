import type { StoryObj, Meta } from '@storybook/react';

import MailerPage from './MailerPage';

export default {
	component: MailerPage,
	parameters: {
		layout: 'fullscreen',
	},
} satisfies Meta<typeof MailerPage>;

export const Default: StoryObj<typeof MailerPage> = {
	render: () => <MailerPage />,
	name: 'Mailer',
};
