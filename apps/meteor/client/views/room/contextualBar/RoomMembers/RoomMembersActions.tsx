import type { IUser, IRoom } from '@rocket.chat/core-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import GenericMenu from '../../../../components/GenericMenu/GenericMenu';
import { useUserInfoActions } from '../../hooks/useUserInfoActions';

type RoomMembersActionsProps = Pick<IUser, '_id' | 'name' | 'username' | 'freeSwitchExtension'> & {
	rid: IRoom['_id'];
	reload: () => void;
};

const RoomMembersActions = ({ username, _id, name, rid, freeSwitchExtension, reload }: RoomMembersActionsProps): ReactElement | null => {
	const t = useTranslation();
	const { menuActions: menuOptions } = useUserInfoActions({ rid, user: { _id, username, name, freeSwitchExtension }, reload, size: 0 });
	if (!menuOptions) {
		return null;
	}
	return <GenericMenu title={t('More')} key='menu' data-qa-id='UserUserInfo-menu' sections={menuOptions} placement='bottom-end' />;
};

export default RoomMembersActions;
