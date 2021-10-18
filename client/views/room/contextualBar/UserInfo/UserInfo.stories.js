import React from 'react';

import * as Status from '../../../../components/UserStatus';
import VerticalBar from '../../../../components/VerticalBar';
import UserInfo from './UserInfo';

export default {
	title: 'room/contextualBar/UserInfo',
	component: UserInfo,
};

const user = {
	name: 'Guilherme Gazzo',
	username: 'guilherme.gazzo',
	customStatus: '🛴 currently working on User Card',
	bio: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla tempus, eros convallis vulputate cursus, nisi neque eleifend libero, eget lacinia justo purus nec est. In at sodales ipsum. Sed lacinia quis purus eget pulvinar. Aenean eu pretium nunc, at aliquam magna. Praesent dignissim, tortor sed volutpat mattis, mauris diam pulvinar leo, porta commodo risus est non purus. Mauris in justo vel lorem ullamcorper hendrerit. Nam est metus, viverra a pellentesque vitae, ornare eget odio. Morbi tempor feugiat mattis. Morbi non felis tempor, aliquam justo sed, sagittis nibh. Mauris consequat ex metus. Praesent sodales sit amet nibh a vulputate. Integer commodo, mi vel bibendum sollicitudin, urna lectus accumsan ante, eget faucibus augue ex id neque. Aenean consectetur, orci a pellentesque mattis, tortor tellus fringilla elit, non ullamcorper risus nunc feugiat risus. Fusce sit amet nisi dapibus turpis commodo placerat. In tortor ante, vehicula sit amet augue et, imperdiet porta sem.',
	// actions: [<UserCard.Action icon='message'/>, <UserCard.Action icon='phone'/>],
	localTime: 'Local Time: 7:44 AM',
	utcOffset: -3,
	email: 'rocketchat@rocket.chat',
	status: <Status.Offline />,
};

const nickname = {
	...user,
	nickname: 'Nickname',
};

export const Default = () => (
	<VerticalBar height={800}>
		<UserInfo {...user} />
	</VerticalBar>
);
export const Nickname = () => (
	<VerticalBar height={800}>
		<UserInfo {...nickname} />
	</VerticalBar>
);
