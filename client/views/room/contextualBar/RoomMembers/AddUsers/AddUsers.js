import React, { useState } from 'react';
import { Field, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import UserAutoCompleteMultiple from '../../../../../../ee/client/audit/UserAutoCompleteMultiple';
import VerticalBar from '../../../../../components/VerticalBar';
import { useTranslation } from '../../../../../contexts/TranslationContext';
import { useForm } from '../../../../../hooks/useForm';
import { useMethod } from '../../../../../contexts/ServerContext';
import { useToastMessageDispatch } from '../../../../../contexts/ToastMessagesContext';
import { useTabBarClose } from '../../../providers/ToolboxProvider';

export const AddUsers = ({
	onClickClose,
	onClickBack,
	onClickSave,
	value,
	onChange,
	errors,
}) => {
	const t = useTranslation();

	return (
		<>
			<VerticalBar.Header>
				{onClickBack && <VerticalBar.Back onClick={onClickBack} />}
				<VerticalBar.Text>{t('Add_users')}</VerticalBar.Text>
				{onClickClose && <VerticalBar.Close onClick={onClickClose} />}
			</VerticalBar.Header>
			<VerticalBar.ScrollableContent>
				<Field >
					<Field.Label flexGrow={0}>{t('Choose_users')}</Field.Label>
					<UserAutoCompleteMultiple errors={errors.users} value={value} onChange={onChange} placeholder={t('Choose_users')} />
					{errors.users && <Field.Error>
						{errors.users}
					</Field.Error>}
				</Field>
			</VerticalBar.ScrollableContent>
			<VerticalBar.Footer>
				<Button primary disabled={!value || value.length === 0} onClick={onClickSave}>{t('Add_users')}</Button>
			</VerticalBar.Footer>
		</>
	);
};

export default ({
	rid,
	onClickBack,
}) => {
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
