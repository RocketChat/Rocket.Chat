import { Box } from '@rocket.chat/fuselage';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { StoryObj, Meta } from '@storybook/react';

import InviteUsers from './InviteUsers';
import InviteUsersEdit from './InviteUsersEdit';
import InviteUsersError from './InviteUsersError';
import InviteUsersLoading from './InviteUsersLoading';
import { links } from '../../../../../lib/links';

export default {
	component: InviteUsers,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [
		(fn) => <Box height='100vh'>{fn()}</Box>,
		mockAppRoot()
			.withTranslations('en', 'core', {
				'Edit_Invite': 'Edit invite',
				'Invite_Users': 'Invite users',
				'Invite_Link': 'Invite link',
				'Expiration_(Days)': 'Expiration (Days)',
				'Max_number_of_uses': 'Max number of uses',
			})
			.buildStoryDecorator(),
	],
} satisfies Meta<typeof InviteUsers>;

export const Default: StoryObj<typeof InviteUsers> = {
	name: 'Invite Link',

	args: {
		linkText: links.go.invite,
		captionText: 'Expire on February 4, 2020 4:45 PM.',
	},
};

export const InviteEdit: StoryObj<typeof InviteUsersEdit> = {
	render: (args) => <InviteUsersEdit {...args} daysAndMaxUses={{ days: '1', maxUses: '5' }} />,
};

export const InviteLoading: StoryObj<typeof InviteUsersLoading> = {
	render: (args) => <InviteUsersLoading {...args} />,
};

export const InviteError: StoryObj<typeof InviteUsersError> = {
	render: (args) => <InviteUsersError {...args} error={new Error('Error message')} />,
};
