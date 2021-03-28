import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useState } from 'react';

import { useMethod } from '../../../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../contexts/ToastMessagesContext';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useForm } from '../../../../../hooks/useForm';
import { useTabBarClose } from '../../../providers/ToolboxProvider';
import AddUsers from './AddUsers';

const AddUsersWithData = ({ rid, onClickBack }) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const [errors, setErrors] = useState({});

	const onClickClose = useTabBarClose();
	const saveAction = useMethod('addUsersToRoom');

	const { values, handlers } = useForm({ users: [] });
	const { users } = values;
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
		if (users.length < 1) {
			return setErrors({
				users: t('Select_at_least_one_user'),
			});
		}

		try {
			await saveAction({ rid, users });
			dispatchToastMessage({ type: 'success', message: t('Users_added') });
			onClickBack();
		} catch (e) {
			dispatchToastMessage({ type: 'error', message: e });
		}

		setErrors({});
	});

	return (
		<AddUsers
			onClickClose={onClickClose}
			onClickBack={onClickBack}
			onClickSave={handleSave}
			value={users}
			onChange={onChangeUsers}
			errors={errors}
		/>
	);
};

export default AddUsersWithData;
