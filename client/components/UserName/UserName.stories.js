import React from 'react';

import UserStatus from '../UserStatus';

import UserName from '.';

export default {
	title: 'components/UserName',
	component: UserName,
	subcomponents: {
		'UserName.Skeleton': UserName.Skeleton,
	},
	argTypes: {
		status: { control: null },
	},
};

export const _UserName = (args) => <UserName {...args} />;
_UserName.storyName = 'UserName';
_UserName.args = {
	status: <UserStatus.Online />,
	name: 'Marie Rowe',
	username: 'marie.rowe',
	nickname: 'Ria',
};

export const Skeleton = (args) => <UserName.Skeleton {...args} />;
