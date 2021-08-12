import React from 'react';

import UserCard from '.';

export default {
	title: 'components/UserCard',
	component: UserCard,
};

const user = {
	name: 'guilherme.gazzo',
	customStatus: '🛴 currently working on User Card',
	roles: [
		<UserCard.Role>Admin</UserCard.Role>,
		<UserCard.Role>Rocket.Chat</UserCard.Role>,
		<UserCard.Role>Team</UserCard.Role>,
	],
	bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla tempus, eros convallis vulputate cursus, nisi neque eleifend libero, eget lacinia justo purus nec est. In at sodales ipsum. Sed lacinia quis purus eget pulvinar. Aenean eu pretium nunc, at aliquam magna. Praesent dignissim, tortor sed volutpat mattis, mauris diam pulvinar leo, porta commodo risus est non purus. Mauris in justo vel lorem ullamcorper hendrerit. Nam est metus, viverra a pellentesque vitae, ornare eget odio. Morbi tempor feugiat mattis. Morbi non felis tempor, aliquam justo sed, sagittis nibh. Mauris consequat ex metus. Praesent sodales sit amet nibh a vulputate. Integer commodo, mi vel bibendum sollicitudin, urna lectus accumsan ante, eget faucibus augue ex id neque. Aenean consectetur, orci a pellentesque mattis, tortor tellus fringilla elit, non ullamcorper risus nunc feugiat risus. Fusce sit amet nisi dapibus turpis commodo placerat. In tortor ante, vehicula sit amet augue et, imperdiet porta sem.',
	actions: [<UserCard.Action icon='message' />, <UserCard.Action icon='phone' />],
	localTime: 'Local Time: 7:44 AM',
};

const nickname = {
	...user,
	nickname: 'nicknamenickname',
};

const largeName = {
	...user,
	customStatus:
		'🛴 currently working on User Card  on User Card  on User Card  on User Card  on User Card ',
	name: 'guilherme.gazzo.guilherme.gazzo.guilherme.gazzo.guilherme.gazzo.guilherme.gazzo.guilherme.gazzo.guilherme.gazzo.guilherme.gazzo.',
};

const noRoles = {
	...user,
	roles: null,
};

const noActions = {
	...user,
	actions: null,
};

const noLocalTime = {
	...user,
	localTime: null,
};

const noBio = {
	...user,
	bio: null,
};

const noBioNoLocalTime = {
	...user,
	bio: null,
	localTime: null,
};

const noBioNoLocalTimeNoRoles = {
	...user,
	bio: null,
	localTime: null,
	roles: null,
};

export const Basic = () => <UserCard {...user} />;
export const Nickname = () => <UserCard {...nickname} />;
export const LargeName = () => <UserCard {...largeName} />;
export const NoRoles = () => <UserCard {...noRoles} />;
export const NoActions = () => <UserCard {...noActions} />;
export const NoLocalTime = () => <UserCard {...noLocalTime} />;
export const NoBio = () => <UserCard {...noBio} />;
export const NoBioAndNoLocalTime = () => <UserCard {...noBioNoLocalTime} />;
export const NoBioNoLocalTimeNoRoles = () => <UserCard {...noBioNoLocalTimeNoRoles} />;

export const Loading = () => <UserCard />;
