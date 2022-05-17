import { Field, Box, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useCallback, useState } from 'react';

import { useEndpointAction } from '../../../hooks/useEndpointAction';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { useForm } from '../../../hooks/useForm';
import UserForm from './UserForm';

export function AddUser({ roles, onReload, ...props }) {
	const t = useTranslation();

	const router = useRoute('admin-users');

	const { value: roleData } = useEndpointData('roles.list', '');
	const [errors, setErrors] = useState({});

	const validationKeys = {
		name: (name) =>
			setErrors((errors) => ({
				...errors,
				name: !name.trim().length ? t('The_field_is_required', t('name')) : undefined,
			})),
		username: (username) =>
			setErrors((errors) => ({
				...errors,
				username: !username.trim().length ? t('The_field_is_required', t('username')) : undefined,
			})),
		email: (email) =>
			setErrors((errors) => ({
				...errors,
				email: !email.trim().length ? t('The_field_is_required', t('email')) : undefined,
			})),
		password: (password, values) =>
			setErrors((errors) => ({
				...errors,
				password: !password.trim().length && !values.setRandomPassword ? t('The_field_is_required', t('password')) : undefined,
			})),
		setRandomPassword: (setRandomPassword, values) =>
			setErrors((errors) => ({
				...errors,
				password: !values.password.trim().length && !setRandomPassword ? t('The_field_is_required', t('password')) : undefined,
			})),
	};

	const validateForm = ({ key, value, values }) => {
		validationKeys[key] && validationKeys[key](value, values);
	};

	const { values, handlers, reset, hasUnsavedChanges } = useForm(
		{
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
		},
		validateForm,
	);

	const goToUser = useCallback(
		(id) =>
			router.push({
				context: 'info',
				id,
			}),
		[router],
	);

	const saveAction = useEndpointAction('POST', 'users.create', values, t('User_created_successfully!'));
	const eventStats = useEndpointAction('POST', 'statistics.telemetry', {
		params: [{ eventName: 'updateCounter', settingsId: 'Manual_Entry_User_Count' }],
	});

	const handleSave = useMutableCallback(async () => {
		Object.entries(values).forEach(([key, value]) => {
			validateForm({ key, value, values });
		});

		const { name, username, password, email, setRandomPassword } = values;
		if (name === '' || username === '' || email === '') {
			return false;
		}
		if (password === '' && setRandomPassword === false) {
			return false;
		}

		const result = await saveAction();
		if (result.success) {
			eventStats();
			goToUser(result.user._id);
			onReload();
		}
	});

	const availableRoles = useMemo(() => roleData?.roles?.map(({ _id, description, name }) => [_id, description || name]) ?? [], [roleData]);

	const append = useMemo(
		() => (
			<Field>
				<Field.Row>
					<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
						<Button flexGrow={1} disabled={!hasUnsavedChanges} onClick={reset} mie='x4'>
							{t('Cancel')}
						</Button>
						<Button flexGrow={1} disabled={!hasUnsavedChanges} onClick={handleSave}>
							{t('Save')}
						</Button>
					</Box>
				</Field.Row>
			</Field>
		),
		[hasUnsavedChanges, reset, t, handleSave],
	);

	return (
		<UserForm errors={errors} formValues={values} formHandlers={handlers} availableRoles={availableRoles} append={append} {...props} />
	);
}
