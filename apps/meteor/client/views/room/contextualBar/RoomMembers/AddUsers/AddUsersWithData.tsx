import type { IRoom } from '@rocket.chat/core-typings';
import { isRoomFederated } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';
// import { useForm } from '../../../../../hooks/useForm';
import { FormProvider, useForm } from 'react-hook-form';

import { useRoom } from '../../../contexts/RoomContext';
import { useTabBarClose } from '../../../contexts/ToolboxContext';
import AddUsers from './AddUsers';

type AddUsersWithDataProps = {
	rid: IRoom['_id'];
	onClickBack: () => void;
	reload: () => void;
};

const AddUsersWithData = ({ rid, onClickBack, reload }: AddUsersWithDataProps): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const room = useRoom();

	const onClickClose = useTabBarClose();
	const saveAction = useMethod('addUsersToRoom');

	const form = useForm({ defaultValues: { users: [] } });
	const { handleSubmit } = form;

	const handleSave = useMutableCallback(async ({ users }) => {
		try {
			await saveAction({ rid, users });
			dispatchToastMessage({ type: 'success', message: t('Users_added') });
			onClickBack();
			reload();
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error as Error });
		}
	});

	return (
		<FormProvider {...form}>
			<AddUsers
				onClickClose={onClickClose}
				onClickBack={onClickBack}
				onClickSave={handleSubmit(handleSave)}
				isRoomFederated={isRoomFederated(room)}
			/>
		</FormProvider>
	);
};

export default AddUsersWithData;
