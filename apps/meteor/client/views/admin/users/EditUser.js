import { Box, Field, Margins, Button } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useState, useCallback } from 'react';

import UserAvatarEditor from '../../../components/avatar/UserAvatarEditor';
import { useEndpointAction } from '../../../hooks/useEndpointAction';
import { useEndpointUpload } from '../../../hooks/useEndpointUpload';
import { useForm } from '../../../hooks/useForm';
import UserForm from './UserForm';

const getInitialValue = (data) => ({
	roles: data.roles,
	name: data.name ?? '',
	password: '',
	username: data.username,
	status: data.status,
	bio: data.bio ?? '',
	nickname: data.nickname ?? '',
	email: (data.emails && data.emails.length && data.emails[0].address) || '',
	verified: (data.emails && data.emails.length && data.emails[0].verified) || false,
	setRandomPassword: false,
	requirePasswordChange: data.setRandomPassword || false,
	customFields: data.customFields ?? {},
	statusText: data.statusText ?? '',
});

function EditUser({ data, roles, onReload, ...props }) {
	const t = useTranslation();

	const [avatarObj, setAvatarObj] = useState();
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
	};

	const validateForm = ({ key, value }) => {
		validationKeys[key] && validationKeys[key](value);
	};

	const { values, handlers, reset, hasUnsavedChanges } = useForm(getInitialValue(data), validateForm);

	const router = useRoute('admin-users');

	const goToUser = useCallback(
		(id) =>
			router.push({
				context: 'info',
				id,
			}),
		[router],
	);

	const saveQuery = useMemo(
		() => ({
			userId: data._id,
			data: values,
		}),
		[data._id, values],
	);

	const saveAvatarQuery = useMemo(
		() => ({
			userId: data._id,
			avatarUrl: avatarObj && avatarObj.avatarUrl,
		}),
		[data._id, avatarObj],
	);

	const resetAvatarQuery = useMemo(
		() => ({
			userId: data._id,
		}),
		[data._id],
	);

	const saveAction = useEndpointAction('POST', 'users.update', saveQuery, t('User_updated_successfully'));
	const saveAvatarAction = useEndpointUpload('users.setAvatar', saveAvatarQuery, t('Avatar_changed_successfully'));
	const saveAvatarUrlAction = useEndpointAction('POST', 'users.setAvatar', saveAvatarQuery, t('Avatar_changed_successfully'));
	const resetAvatarAction = useEndpointAction('POST', 'users.resetAvatar', resetAvatarQuery, t('Avatar_changed_successfully'));

	const updateAvatar = useCallback(async () => {
		if (avatarObj === 'reset') {
			return resetAvatarAction();
		}
		if (avatarObj.avatarUrl) {
			return saveAvatarUrlAction();
		}
		avatarObj.set('userId', data._id);
		return saveAvatarAction(avatarObj);
	}, [avatarObj, resetAvatarAction, saveAvatarAction, saveAvatarUrlAction, data._id]);

	const handleSave = useMutableCallback(async () => {
		Object.entries(values).forEach(([key, value]) => {
			validationKeys[key] && validationKeys[key](value);
		});

		const { name, username, email } = values;
		if (name === '' || username === '' || email === '') {
			return false;
		}

		if (hasUnsavedChanges) {
			const result = await saveAction();
			if (result.success && avatarObj) {
				await updateAvatar();
			}
		} else {
			await updateAvatar();
		}
		onReload();
		goToUser(data._id);
	}, [hasUnsavedChanges, avatarObj, data._id, goToUser, saveAction, updateAvatar, values, errors, validationKeys]);

	const availableRoles = roles.map(({ _id, name, description }) => [_id, description || name]);

	const canSaveOrReset = hasUnsavedChanges || avatarObj;

	const prepend = useMemo(
		() => (
			<UserAvatarEditor currentUsername={data.username} username={values.username} etag={data.avatarETag} setAvatarObj={setAvatarObj} />
		),
		[data.username, data.avatarETag, values.username],
	);

	const append = useMemo(
		() => (
			<Field>
				<Field.Row>
					<Box display='flex' flexDirection='row' justifyContent='space-between' w='full'>
						<Margins inlineEnd='x4'>
							<Button flexGrow={1} type='reset' disabled={!canSaveOrReset} onClick={reset}>
								{t('Reset')}
							</Button>
							<Button mie='none' flexGrow={1} disabled={!canSaveOrReset} onClick={handleSave}>
								{t('Save')}
							</Button>
						</Margins>
					</Box>
				</Field.Row>
			</Field>
		),
		[handleSave, canSaveOrReset, reset, t],
	);

	return (
		<UserForm
			errors={errors}
			formValues={values}
			formHandlers={handlers}
			availableRoles={availableRoles}
			prepend={prepend}
			append={append}
			{...props}
		/>
	);
}

export default EditUser;
