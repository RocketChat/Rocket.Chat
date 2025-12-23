import { ContextualbarDialog } from '@rocket.chat/ui-client';
import type { Meta, StoryFn } from '@storybook/react';

import * as Status from '../UserStatus';
import UserInfo from './UserInfo';
import { UserCardRole } from '../UserCard';

export default {
	component: UserInfo,
	parameters: {
		layout: 'fullscreen',
		actions: { argTypesRegex: '^on.*' },
	},
	decorators: [
		(fn) => (
			<ContextualbarDialog aria-label='User Info' height='100vh'>
				{fn()}
			</ContextualbarDialog>
		),
	],
} satisfies Meta<typeof UserInfo>;

const defaultArgs = {
	name: 'Guilherme Gazzo',
	username: 'guilherme.gazzo',
	nickname: 'gazzo',
	statusText: '🛴 currently working on User Card',
	bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla tempus, eros convallis vulputate cursus, nisi neque eleifend libero, eget lacinia justo purus nec est. In at sodales ipsum. Sed lacinia quis purus eget pulvinar. Aenean eu pretium nunc, at aliquam magna. Praesent dignissim, tortor sed volutpat mattis, mauris diam pulvinar leo, porta commodo risus est non purus.',
	email: 'rocketchat@rocket.chat',
	status: <Status.Offline />,
	roles: [<UserCardRole key='admin'>admin</UserCardRole>, <UserCardRole key='user'>user</UserCardRole>],
};

const Template: StoryFn<typeof UserInfo> = (args) => <UserInfo {...defaultArgs} {...args} />;

export const Default = Template.bind({});

export const WithVoiceCallExtension = Template.bind({});
WithVoiceCallExtension.args = {
	freeSwitchExtension: '1234567890',
};

export const WithABACAttributes = Template.bind({});
WithABACAttributes.args = {
	abacAttributes: [
		{
			key: 'Classified',
			values: ['Top Secret', 'Confidential'],
		},
		{
			key: 'Security_Clearance',
			values: ['Top Secret', 'Confidential'],
		},
	],
};

export const InvitedUser = Template.bind({});
InvitedUser.args = {
	invitationDate: '2025-01-01T12:00:00Z',
};
