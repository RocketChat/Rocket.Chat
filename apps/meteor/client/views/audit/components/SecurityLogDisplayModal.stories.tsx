import type { StoryObj, Meta } from '@storybook/react';

import SecurityLogDisplayModal from './SecurityLogDisplayModal';

export default {
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

export const Default: StoryObj<typeof SecurityLogDisplayModal> = {};

export const System: StoryObj<typeof SecurityLogDisplayModal> = {
	render: (args) => <SecurityLogDisplayModal {...args} actor={{ type: 'system', reason: 'update' }} />,
};

export const App: StoryObj<typeof SecurityLogDisplayModal> = {
	render: (args) => <SecurityLogDisplayModal {...args} actor={{ type: 'app', _id: 'app-id' }} />,
};
