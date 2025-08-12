import { mockAppRoot } from '@rocket.chat/mock-providers';
import type { Meta, StoryFn } from '@storybook/react';

import InviteUsers from './InviteUsers';
import InviteUsersEdit from './InviteUsersEdit';
import InviteUsersError from './InviteUsersError';
import InviteUsersLoading from './InviteUsersLoading';
import { Contextualbar } from '../../../../../components/Contextualbar';

export default {
	title: 'Room/Contextual Bar/RoomMembers/InviteUsers',
	component: InviteUsers,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [
		(fn) => <Contextualbar height='100vh'>{fn()}</Contextualbar>,
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

export const Default: StoryFn<typeof InviteUsers> = (args) => <InviteUsers {...args} />;
Default.storyName = 'Invite Link';
Default.args = {
	linkText: 'https://go.rocket.chat/invite?host=open.rocket.chat&path=invite%2F5sBs3a',
	captionText: 'Expire on February 4, 2020 4:45 PM.',
};

export const InviteEdit: StoryFn<typeof InviteUsersEdit> = (args) => (
	<InviteUsersEdit {...args} daysAndMaxUses={{ days: '1', maxUses: '5' }} />
);

export const InviteLoading: StoryFn<typeof InviteUsersLoading> = (args) => <InviteUsersLoading {...args} />;

export const InviteError: StoryFn<typeof InviteUsersError> = (args) => <InviteUsersError {...args} error={new Error('Error message')} />;
