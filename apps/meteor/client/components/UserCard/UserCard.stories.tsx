import type { Meta } from '@storybook/react';

import { UserCard, UserCardRole, UserCardAction } from '.';

const user = {
	name: 'guilherme.gazzo',
	customStatus: '🛴 currently working on User Card',
	roles: (
		<>
			<UserCardRole>Admin</UserCardRole>
			<UserCardRole>Rocket.Chat</UserCardRole>
			<UserCardRole>Team</UserCardRole>
		</>
	),
	bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla tempus, eros convallis vulputate cursus, nisi neque eleifend libero, eget lacinia justo purus nec est. In at sodales ipsum. Sed lacinia quis purus eget pulvinar. Aenean eu pretium nunc, at aliquam magna. Praesent dignissim, tortor sed volutpat mattis, mauris diam pulvinar leo, porta commodo risus est non purus. Mauris in justo vel lorem ullamcorper hendrerit. Nam est metus, viverra a pellentesque vitae, ornare eget odio. Morbi tempor feugiat mattis. Morbi non felis tempor, aliquam justo sed, sagittis nibh. Mauris consequat ex metus. Praesent sodales sit amet nibh a vulputate. Integer commodo, mi vel bibendum sollicitudin, urna lectus accumsan ante, eget faucibus augue ex id neque. Aenean consectetur, orci a pellentesque mattis, tortor tellus fringilla elit, non ullamcorper risus nunc feugiat risus. Fusce sit amet nisi dapibus turpis commodo placerat. In tortor ante, vehicula sit amet augue et, imperdiet porta sem.',
	localTime: 'Local Time: 7:44 AM',
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
				<UserCardAction icon='message' />
				<UserCardAction icon='phone' />
			</>
		),
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

export const NoBio = {
	args: {
		user: {
			...user,
			bio: undefined,
		},
	} as any,
};

export const NoBioAndNoLocalTime = {
	args: {
		user: {
			...user,
			bio: undefined,
			localTime: undefined,
		},
	} as any,
};

export const NoBioNoLocalTimeNoRoles = {
	args: {
		user: {
			...user,
			bio: undefined,
			localTime: undefined,
			roles: undefined,
		},
	} as any,
};

export const Loading = () => <UserCard />;
