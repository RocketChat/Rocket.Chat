import type { Meta } from '@storybook/react';

import { UserCard, UserCardRole, UserCardAction } from '.';

const user = {
	name: 'Guilherme Gazzo',
	username: 'guilherme.gazzo',
	customStatus: '🛴 currently working on User Card',
	workspaceRoles: 'Admin, Livechat Agent',
	roles: (
		<>
			<UserCardRole>Admin</UserCardRole>
			<UserCardRole>Rocket.Chat</UserCardRole>
			<UserCardRole>Team</UserCardRole>
		</>
	),
	localTime: '7:44 AM local time',
};

export default {
	component: UserCard,
	parameters: {
		layout: 'centered',
	},
	args: {
		user,
		actions: (
			<>
				<UserCardAction icon='balloon' label='Message' />
				<UserCardAction icon='phone' label='Call' />
			</>
		),
		onOpenUserInfo: () => undefined,
	},
} satisfies Meta<typeof UserCard>;

export const Example = {};

export const Nickname = {
	args: {
		user: {
			...user,
			nickname: 'nicknamenickname',
		},
	} as any,
};

export const LargeName = {
	args: {
		user: {
			...user,
			customStatus: '🛴 currently working on User Card  on User Card  on User Card  on User Card  on User Card ',
			name: 'guilherme.gazzo.guilherme.gazzo.guilherme.gazzo.guilherme.gazzo.guilherme.gazzo.guilherme.gazzo.guilherme.gazzo.guilherme.gazzo.',
		},
	} as any,
};

export const NoRoles = {
	args: {
		user: {
			...user,
			roles: undefined,
		},
	} as any,
};

export const NoActions = {
	args: {
		actions: undefined,
	} as any,
};

export const NoLocalTime = {
	args: {
		user: {
			...user,
			localTime: undefined,
		},
	} as any,
};

export const NoLocalTimeNoRoles = {
	args: {
		user: {
			...user,
			localTime: undefined,
			roles: undefined,
		},
	} as any,
};

export const Loading = () => <UserCard />;
