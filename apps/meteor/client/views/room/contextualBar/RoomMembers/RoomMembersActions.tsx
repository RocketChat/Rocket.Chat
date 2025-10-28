import type { IUser, IRoom } from '@rocket.chat/core-typings';
import { GenericMenu } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useUserInfoActions } from '../../hooks/useUserInfoActions';

type RoomMembersActionsProps = Pick<IUser, '_id' | 'name' | 'username' | 'freeSwitchExtension'> & {
	rid: IRoom['_id'];
	reload: () => void;
};

const RoomMembersActions = ({ username, _id, name, rid, freeSwitchExtension, reload }: RoomMembersActionsProps): ReactElement | null => {
	const { t } = useTranslation();

	const { menuActions: menuOptions } = useUserInfoActions({
		rid,
		user: { _id, username, name, freeSwitchExtension },
		reload,
		size: 0,
		isMember: true,
	});

	if (!menuOptions) {
		return null;
	}
	return <GenericMenu detached title={t('More')} key='menu' data-qa-id='UserUserInfo-menu' sections={menuOptions} placement='bottom-end' />;
};

export default RoomMembersActions;
