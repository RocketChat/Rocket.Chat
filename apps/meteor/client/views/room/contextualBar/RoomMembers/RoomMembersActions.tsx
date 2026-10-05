import type { IUser, IRoom } from '@rocket.chat/core-typings';
import { GenericMenu } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { useUserInfoActions } from '../../hooks/useUserInfoActions';

export type RoomMembersActionsProps = Pick<IUser, '_id' | 'name' | 'username' | 'sipExtension'> & {
	rid: IRoom['_id'];
	isInvited?: boolean;
	reload: () => void;
};

const RoomMembersActions = ({ username, _id, name, rid, sipExtension, isInvited, reload }: RoomMembersActionsProps) => {
	const { t } = useTranslation();

	const { menuActions: menuOptions } = useUserInfoActions({
		rid,
		user: { _id, username, name, sipExtension },
		reload,
		size: 0,
		isMember: !isInvited,
		isInvited,
	});

	if (!menuOptions) {
		return null;
	}
	return <GenericMenu detached title={t('More')} key='menu' sections={menuOptions} placement='bottom-end' />;
};

export default RoomMembersActions;
