import type { Meta, StoryFn } from '@storybook/react';

import SecurityLogDisplayModal from './SecurityLogDisplayModal';

export default {
	title: 'views/Audit/SecurityLogDisplay',
	component: SecurityLogDisplayModal,
	args: {
		timestamp: 'Thursday, 20-Mar-25 17:17:46',
		actor: {
			type: 'user',
			_id: 'user-id',
			username: 'username',
			useragent: 'useragent',
			ip: '127.0.0.1',
		},
		setting: 'Show_message_in_email_notification',
		changedFrom: 'false',
		changedTo: 'true',
	},
} satisfies Meta<typeof SecurityLogDisplayModal>;

export const Default: StoryFn<typeof SecurityLogDisplayModal> = (args) => <SecurityLogDisplayModal {...args} />;

export const system: StoryFn<typeof SecurityLogDisplayModal> = (args) => (
	<SecurityLogDisplayModal {...args} actor={{ type: 'system', reason: 'update' }} />
);

export const app: StoryFn<typeof SecurityLogDisplayModal> = (args) => (
	<SecurityLogDisplayModal {...args} actor={{ type: 'app', _id: 'app-id' }} />
);
