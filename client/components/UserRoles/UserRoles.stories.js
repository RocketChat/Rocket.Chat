import React from 'react';

import UserRoles from '.';

export default {
	title: 'components/UserRoles',
	component: UserRoles,
	subcomponents: {
		'UserRoles.Skeleton': UserRoles.Skeleton,
	},
};

export const _UserRoles = () => (
	<UserRoles>
		<UserRoles.Item>Admin</UserRoles.Item>
		<UserRoles.Item>Engineering Team</UserRoles.Item>
	</UserRoles>
);
_UserRoles.storyName = 'UserRoles';

export const Skeleton = () => (
	<UserRoles.Skeleton />
);
