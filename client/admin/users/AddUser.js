import React, { useMemo, useCallback } from 'react';
import { Field, Box, Button } from '@rocket.chat/fuselage';

import { useTranslation } from '../../contexts/TranslationContext';
import { useEndpointData } from '../../hooks/useEndpointData';
import { useEndpointAction } from '../../hooks/useEndpointAction';
import { useRoute } from '../../contexts/RouterContext';
import { useForm } from '../../hooks/useForm';
import UserForm from './UserForm';


export function AddUser({ roles, ...props }) {
	const t = useTranslation();

	const router = useRoute('admin-users');

	const roleData = useEndpointData('roles.list', '') || {};

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
		email: '',
		password: '',
		verified: false,
		requirePasswordChange: false,
		setRandomPassword: false,
		sendWelcomeEmail: true,
		joinDefaultChannels: true,
		customFields: {},
	});

	const goToUser = useCallback((id) => router.push({
		context: 'info',
		id,
	}), [router]);

	// TODO: remove JSON.stringify. Is used to keep useEndpointAction from rerendering the page indefinitely.
	const saveQuery = useMemo(() => values, [JSON.stringify(values)]);

	const saveAction = useEndpointAction('POST', 'users.create', saveQuery, t('User_created_successfully'));

	const handleSave = useCallback(async () => {
		const result = await saveAction();
		if (result.success) {
			goToUser(result.user._id);
		}
	}, [goToUser, saveAction]);

	const availableRoles = useMemo(() => (roleData && roleData.roles ? roleData.roles.map(({ _id, description }) => [_id, description || _id]) : []), [roleData]);

	const append = useMemo(() => <Field>
		<Field.Row>
			<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
				<Button flexGrow={1} disabled={!hasUnsavedChanges} onClick={reset} mie='x4'>{t('Cancel')}</Button>
				<Button flexGrow={1} disabled={!hasUnsavedChanges} onClick={handleSave}>{t('Save')}</Button>
			</Box>
		</Field.Row>
	</Field>, [hasUnsavedChanges, reset, t, handleSave]);

	return <UserForm formValues={values} formHandlers={handlers} availableRoles={availableRoles} append={append} {...props}/>;
}
