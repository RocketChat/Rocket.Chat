import type { AvatarObject, AvatarUrlObj, ISubscription, IUser } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { useEndpoint, useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import React, { useState, useCallback } from 'react';

import UserAvatarEditor from '../../../components/avatar/UserAvatarEditor';
import { useEndpointAction } from '../../../hooks/useEndpointAction';
import { useEndpointUpload } from '../../../hooks/useEndpointUpload';
import { dispatchToastMessage } from '../../../lib/toast';
import UserForm from './UserForm';

const isAvatarObjUrl = (avatarObj: AvatarObject): avatarObj is AvatarUrlObj => {
	return (avatarObj as AvatarUrlObj).avatarUrl !== undefined;
};

const isFormData = (avatarObj: AvatarObject): avatarObj is FormData => {
	return (avatarObj as FormData).set !== undefined;
};

type EditUserProps = {
	data: IUser & { rooms?: Pick<ISubscription, 'rid' | 'name' | 't' | 'roles' | 'unread'>[] };
	onReload: () => void;
	availableRoles: SelectOption[];
	roles: any;
};

function EditUser({ data, onReload, availableRoles, ...props }: EditUserProps) {
	const t = useTranslation();

	const [avatarObj, setAvatarObj] = useState<AvatarObject>();
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	// const [errors, setErrors] = useState({});

	// const validationKeys = {
	// 	name: (name) =>
	// 		setErrors((errors) => ({
	// 			...errors,
	// 			name: !name.trim().length ? t('The_field_is_required', t('name')) : undefined,
	// 		})),
	// 	username: (username) =>
	// 		setErrors((errors) => ({
	// 			...errors,
	// 			username: !username.trim().length ? t('The_field_is_required', t('username')) : undefined,
	// 		})),
	// 	email: (email) =>
	// 		setErrors((errors) => ({
	// 			...errors,
	// 			email: !email.trim().length ? t('The_field_is_required', t('email')) : undefined,
	// 		})),
	// };

	// const validateForm = ({ key, value }) => {
	// 	validationKeys[key] && validationKeys[key](value);
	// };

	// const { values, handlers, reset, hasUnsavedChanges } = useForm(getInitialValue(data), validateForm);

	const router = useRouter();

	const goToUser = useCallback(
		(id) =>
			router.navigate({
				pattern: '/admin/users/:context?/:id?',
				params: { context: 'info', id },
			}),
		[router],
	);

	// const handleSave = useMutableCallback(async () => {
	// 	// Object.entries(values).forEach(([key, value]) => {
	// 	// 	validationKeys[key] && validationKeys[key](value);
	// 	// });
	// 	// const { name, username, email } = values;
	// 	// if (name === '' || username === '' || email === '') {
	// 	// 	return false;
	// 	// }
	// }, [hasUnsavedChanges, avatarObj, data._id, goToUser, saveAction, updateAvatar, values, errors, validationKeys]);

	const saveAvatarAction = useEndpointUpload('/v1/users.setAvatar', t('Avatar_changed_successfully'));
	const saveAvatarUrlAction = useEndpointAction('POST', '/v1/users.setAvatar', { successMessage: t('Avatar_changed_successfully') });
	const resetAvatarAction = useEndpointAction('POST', '/v1/users.resetAvatar', { successMessage: t('Avatar_changed_successfully') });

	const updateAvatar = useCallback(async () => {
		if (!avatarObj) return;

		if (avatarObj === 'reset') {
			return resetAvatarAction({
				userId: data._id,
			});
		}
		if (isAvatarObjUrl(avatarObj)) {
			return saveAvatarUrlAction({
				userId: data._id,
				avatarUrl: avatarObj.avatarUrl,
			});
		}
		if (isFormData(avatarObj)) {
			avatarObj?.set('userId', data._id);
			saveAvatarAction(avatarObj);
		}
	}, [avatarObj, resetAvatarAction, saveAvatarAction, saveAvatarUrlAction, data._id]);

	const saveAction = useEndpoint('POST', '/v1/users.update');
	const handleSaveEditedUser = useMutation({
		mutationFn: saveAction,
		onSuccess: async ({ user: { _id } }) => {
			dispatchToastMessage({ type: 'success', message: t('User_updated_successfully') });
			await updateAvatar();
			goToUser(_id);
			onReload();
		},
	});

	const canSaveOrReset = hasUnsavedChanges || Boolean(avatarObj);

	const prepend = useCallback(
		(currentUsername, username, avatarETag) => (
			<UserAvatarEditor currentUsername={currentUsername} username={username} etag={avatarETag} setAvatarObj={setAvatarObj} />
		),
		[],
	);

	return (
		<UserForm
			availableRoles={availableRoles}
			prepend={prepend}
			setHasUnsavedChanges={setHasUnsavedChanges}
			canSaveOrReset={canSaveOrReset}
			onReload={onReload}
			onSave={handleSaveEditedUser}
			preserveData
			userData={data}
			{...props}
		/>
	);
}

export default EditUser;
