import React, { useMemo, useCallback, useState } from 'react';
import { Field, Box, Button } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { useEndpointAction } from '../../../hooks/useEndpointAction';
import { useRoute } from '../../../contexts/RouterContext';
import { useForm } from '../../../hooks/useForm';
import UserForm from './UserForm';


export function AddUser({ roles, ...props }) {
	const t = useTranslation();

	const router = useRoute('admin-users');

	const { value: roleData } = useEndpointData('roles.list', '');
	const [errors, setErrors] = useState({});

	const validationKeys = useMemo(() => ({
		name: (name) => setErrors((errors) => ({ ...errors, name: name.trim().length ? name : undefined })),
		username: (username) => (username.trim() === '' ? setErrors({ ...errors, username: t('The_field_is_required', t('username')) }) : setErrors({ ...errors, username: '' })),
		email: (email) => (email.trim() === '' ? setErrors({ ...errors, email: t('The_field_is_required', t('email')) }) : setErrors({ ...errors, email: '' })),
	}), [errors, t]);

	const validateForm = ({ key, value }) => {
		validationKeys[key] && validationKeys[key](value);
	};

	const {
		values,
		handlers,
		reset,
		hasUnsavedChanges,
	} = useForm({
		roles: [],
		name: '',
		username: '',
		statusText: '',
		bio: '',
		nickname: '',
		email: '',
		password: '',
		verified: false,
		requirePasswordChange: false,
		setRandomPassword: false,
		sendWelcomeEmail: true,
		joinDefaultChannels: true,
		customFields: {},
	}, validateForm);

	const goToUser = useCallback((id) => router.push({
		context: 'info',
		id,
	}), [router]);

	const saveAction = useEndpointAction('POST', 'users.create', values, t('User_created_successfully!'));

	const handleSave = useCallback(async () => {
		Object.entries(values).forEach(([key, value]) => {
			if (validationKeys[key]) {
				validationKeys[key](value);
			}
		});

		const { name, username, email } = errors;
		if ((name && name !== '') || (username && username !== '') || (email && email !== '')) {
			return false;
		}

		const result = await saveAction();
		if (result.success) {
			goToUser(result.user._id);
		}
	}, [goToUser, saveAction, values, validationKeys, errors]);

	const availableRoles = useMemo(() => roleData?.roles?.map(({ _id, description }) => [_id, description || _id]) ?? [], [roleData]);

	const append = useMemo(() => <Field>
		<Field.Row>
			<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
				<Button flexGrow={1} disabled={!hasUnsavedChanges} onClick={reset} mie='x4'>{t('Cancel')}</Button>
				<Button flexGrow={1} disabled={!hasUnsavedChanges} onClick={handleSave}>{t('Save')}</Button>
			</Box>
		</Field.Row>
	</Field>, [hasUnsavedChanges, reset, t, handleSave]);

	return <UserForm errors={errors} formValues={values} formHandlers={handlers} availableRoles={availableRoles} append={append} {...props}/>;
}
