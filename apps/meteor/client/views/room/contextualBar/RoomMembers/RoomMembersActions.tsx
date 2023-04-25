import type { IUser, IRoom } from '@rocket.chat/core-typings';
import { Option, Menu } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

import { useActionSpread } from '../../../hooks/useActionSpread';
import { useUserInfoActions } from '../../hooks/useUserInfoActions';

type RoomMembersActionsProps = {
	username: IUser['username'];
	_id: IUser['_id'];
	rid: IRoom['_id'];
	reload: () => void;
};

const RoomMembersActions = ({ username, _id, rid, reload }: RoomMembersActionsProps): ReactElement | null => {
	const { menu: menuOptions } = useActionSpread(useUserInfoActions({ _id, username }, rid, reload), 0);
	if (!menuOptions) {
		return null;
	}

	return (
		<Menu
			flexShrink={0}
			maxHeight='initial'
			key='menu'
			tiny
			renderItem={({ label: { label, icon }, ...props }): ReactElement => <Option {...props} label={label} icon={icon} />}
			options={menuOptions}
		/>
	);
};

export default RoomMembersActions;
