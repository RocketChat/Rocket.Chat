import type { Meta, StoryFn } from '@storybook/react';

import { SecurityLogDisplay } from './SecurityLogDisplayModal';

export default {
	title: 'Components/Audit/Modal/SecurityLogDisplay',
	component: SecurityLogDisplay,
	args: {
		timestamp: '2021-10-01T00:00:00.000Z',
		actor: 'John Doe',
		setting: 'Show_message_in_email_notification',
		settingType: 'string',
		changedFrom: 'false',
		changedTo: 'true',
	},
} satisfies Meta<typeof SecurityLogDisplay>;

export const Default: StoryFn<typeof SecurityLogDisplay> = (args) => <SecurityLogDisplay {...args} />;
