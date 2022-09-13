import { IRoom, isRoomFederated, IUser } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { useForm } from '../../../../../hooks/useForm';
import { useRoom } from '../../../contexts/RoomContext';
import { useTabBarClose } from '../../../providers/ToolboxProvider';
import AddUsers from './AddUsers';

type AddUsersWithDataProps = {
	rid: IRoom['_id'];
	onClickBack: () => void;
	reload: () => void;
};

type AddUsersInitialProps = {
	users: Exclude<IUser['username'], undefined>[];
};

const AddUsersWithData = ({ rid, onClickBack, reload }: AddUsersWithDataProps): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const room = useRoom();

	const onClickClose = useTabBarClose();
	const saveAction = useMethod('addUsersToRoom');

	const { values, handlers } = useForm({ users: [] as IUser['username'][] });
	const { users } = values as AddUsersInitialProps;
	const { handleUsers } = handlers;

	const onChangeUsers = useMutableCallback((value, action) => {
		if (!action) {
			if (users.includes(value)) {
				return;
			}
			return handleUsers([...users, value]);
		}
		handleUsers(users.filter((current) => current !== value));
	});

	const handleSave = useMutableCallback(async () => {
		try {
			await saveAction({ rid, users });
			dispatchToastMessage({ type: 'success', message: t('Users_added') });
			onClickBack();
			reload();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error as Error });
		}
	});
	const onChangeUsersFn = isRoomFederated(room) ? handleUsers : onChangeUsers;

	return (
		<AddUsers
			onClickClose={onClickClose}
			onClickBack={onClickBack}
			onClickSave={handleSave}
			users={users}
			isRoomFederated={isRoomFederated(room)}
			onChange={onChangeUsersFn}
		/>
	);
};

export default AddUsersWithData;
