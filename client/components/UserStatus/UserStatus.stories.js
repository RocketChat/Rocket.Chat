import React from 'react';

import UserStatus from '.';

export default {
	title: 'components/UserStatus',
	component: UserStatus,
	subcomponents: {
		'UserStatus.Away': UserStatus.Away,
		'UserStatus.Busy': UserStatus.Busy,
		'UserStatus.Loading': UserStatus.Loading,
		'UserStatus.Offline': UserStatus.Offline,
		'UserStatus.Online': UserStatus.Online,
	},
};

export const _UserStatus = (args) => <UserStatus {...args} />;
_UserStatus.storyName = 'UserStatus';

export const Loading = (args) => <UserStatus.Loading {...args} />;

export const Online = (args) => <UserStatus.Online {...args} />;

export const Away = (args) => <UserStatus.Away {...args} />;

export const Busy = (args) => <UserStatus.Busy {...args} />;

export const Offline = (args) => <UserStatus.Offline {...args} />;
