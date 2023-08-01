import type { AvatarObject, AvatarUrlObj, IUser, Serialized } from '@rocket.chat/core-typings';
import type { SelectOption } from '@rocket.chat/fuselage';
import { useEndpoint, useRouter, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useMutation } from '@tanstack/react-query';
import React, { useState, useCallback } from 'react';

import { useEndpointAction } from '../../../hooks/useEndpointAction';
import { useEndpointUpload } from '../../../hooks/useEndpointUpload';
import UserForm from './UserForm';

const isAvatarObjUrl = (avatarObj: AvatarObject): avatarObj is AvatarUrlObj => {
	return (avatarObj as AvatarUrlObj).avatarUrl !== undefined;
};

const isFormData = (avatarObj: AvatarObject): avatarObj is FormData => {
	return (avatarObj as FormData).set !== undefined;
};

type EditUserProps = {
	userData: Serialized<IUser> | Record<string, never>;
	onReload: () => void;
	availableRoles: SelectOption[];
	roles: any;
};

function EditUser({ userData, onReload, availableRoles, ...props }: EditUserProps) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();

	const [avatarObj, setAvatarObj] = useState<AvatarObject>();
	const router = useRouter();

	const goToUser = useCallback(
		(id) =>
			router.navigate({
				pattern: '/admin/users/:context?/:id?',
				params: { context: 'info', id },
			}),
		[router],
	);

	const saveAvatarAction = useEndpointUpload('/v1/users.setAvatar', t('Avatar_changed_successfully'));
	const saveAvatarUrlAction = useEndpointAction('POST', '/v1/users.setAvatar', { successMessage: t('Avatar_changed_successfully') });
	const resetAvatarAction = useEndpointAction('POST', '/v1/users.resetAvatar', { successMessage: t('Avatar_changed_successfully') });

	const updateAvatar = useCallback(async () => {
		if (!avatarObj) return;

		if (avatarObj === 'reset') {
			return resetAvatarAction({
				userId: userData._id,
			});
		}
		if (isAvatarObjUrl(avatarObj)) {
			return saveAvatarUrlAction({
				userId: userData._id,
				avatarUrl: avatarObj.avatarUrl,
			});
		}
		if (isFormData(avatarObj)) {
			avatarObj?.set('userId', userData._id);
			saveAvatarAction(avatarObj);
		}
	}, [avatarObj, resetAvatarAction, saveAvatarAction, saveAvatarUrlAction, userData._id]);

	const saveAction = useEndpoint('POST', '/v1/users.update');
	const handleSaveEditedUser = useMutation({
		mutationFn: saveAction,
		onSuccess: async ({ user: { _id } }) => {
			dispatchToastMessage({ type: 'success', message: t('User_updated_successfully') });
			await updateAvatar();
			onReload();
			goToUser(_id);
		},
	});

	return (
		<UserForm
			preserveData
			availableRoles={availableRoles}
			onSave={handleSaveEditedUser}
			userData={userData}
			setAvatarObj={setAvatarObj}
			{...props}
		/>
	);
}

export default EditUser;
