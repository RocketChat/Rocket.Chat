import type { Meta, StoryFn } from '@storybook/react';

import SecurityLogDisplayModal from './SecurityLogDisplayModal';

export default {
	title: 'views/Audit/SecurityLogDisplay',
	component: SecurityLogDisplayModal,
	args: {
		timestamp: 'Thursday, 20-Mar-25 17:17:46',
		actor: 'John Doe',
		setting: 'Show_message_in_email_notification',
		changedFrom: 'false',
		changedTo: 'true',
	},
} satisfies Meta<typeof SecurityLogDisplayModal>;

export const Default: StoryFn<typeof SecurityLogDisplayModal> = (args) => <SecurityLogDisplayModal {...args} />;
