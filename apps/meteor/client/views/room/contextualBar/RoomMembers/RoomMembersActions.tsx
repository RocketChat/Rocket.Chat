import type { IUser, IRoom } from '@rocket.chat/core-typings';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useUserInfoActions } from '../../hooks/useUserInfoActions';

type RoomMembersActionsProps = {
	username: IUser['username'];
	name: IUser['name'];
	_id: IUser['_id'];
	rid: IRoom['_id'];
	reload: () => void;
};

const RoomMembersActions = ({ username, _id, name, rid, reload }: RoomMembersActionsProps): ReactElement | null => {
	const t = useTranslation();
	const { menuActions: menuOptions } = useUserInfoActions({ _id, username, name }, rid, reload, 0, true);
	if (!menuOptions) {
		return null;
	}
	return <GenericMenu title={t('More')} key='menu' data-qa-id='UserUserInfo-menu' sections={menuOptions} placement='bottom-end' />;
};

export default RoomMembersActions;
