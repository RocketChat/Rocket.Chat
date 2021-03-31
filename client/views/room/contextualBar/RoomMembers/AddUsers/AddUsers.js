import React from 'react';
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
					<UserAutoCompleteMultiple value={value} onChange={onChange} placeholder={t('Choose_users')} />
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
	reload,
}) => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

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
		try {
			await saveAction({ rid, users });
			dispatchToastMessage({ type: 'success', message: t('Users_added') });
			onClickBack();
			reload();
		} catch ({ message }) {
			dispatchToastMessage({ type: 'error', message });
		}
	});

	return (
		<AddUsers
			onClickClose={onClickClose}
			onClickBack={onClickBack}
			onClickSave={handleSave}
			value={users}
			onChange={onChangeUsers}
		/>
	);
};
