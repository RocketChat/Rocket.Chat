import type { IUser, IRoom } from '@rocket.chat/core-typings';
import { UserCardRole, UserInfo } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';

import { useUserRolesByScope } from '../../../../hooks/useUserRolesByScope';

type UserInfoWithRolesProps = Omit<ComponentProps<typeof UserInfo>, 'roles' | 'roomRoles'> & {
	uid: IUser['_id'];
	rid: IRoom['_id'];
	userRoleIds?: IUser['roles'];
};

const UserInfoWithRoles = ({ uid, rid, userRoleIds, ...props }: UserInfoWithRolesProps) => {
	const { workspaceRoles, roomRoles } = useUserRolesByScope(uid, rid, { userRoleIds });

	return (
		<UserInfo
			{...props}
			/**
			 * TODO: We shouldn't use UserCard components outside UserCard
			 */
			roles={workspaceRoles.map((role, index) => (
				<UserCardRole key={index}>{role}</UserCardRole>
			))}
			roomRoles={roomRoles.map((role, index) => (
				<UserCardRole key={index}>{role}</UserCardRole>
			))}
		/>
	);
};

export default UserInfoWithRoles;
