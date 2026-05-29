import type { AvatarObject, AvatarServiceObject, AvatarReset, AvatarUrlObj, IUser } from '@rocket.chat/core-typings';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useEndpointMutation } from './useEndpointMutation';
import { useEndpointUploadMutation } from './useEndpointUploadMutation';

const isAvatarReset = (avatarObj: AvatarObject): avatarObj is AvatarReset => avatarObj === 'reset';
const isServiceObject = (avatarObj: AvatarObject): avatarObj is AvatarServiceObject =>
	!isAvatarReset(avatarObj) && typeof avatarObj === 'object' && 'service' in avatarObj;
const isAvatarUrl = (avatarObj: AvatarObject): avatarObj is AvatarUrlObj =>
	!isAvatarReset(avatarObj) && typeof avatarObj === 'object' && 'service' && 'avatarUrl' in avatarObj;

export const useUpdateAvatar = (avatarObj: AvatarObject, userId: IUser['_id']) => {
	const { t } = useTranslation();
	const avatarUrl = isAvatarUrl(avatarObj) ? avatarObj.avatarUrl : '';

	const successMessage = t('Avatar_changed_successfully');

	const dispatchToastMessage = useToastMessageDispatch();

	const { mutateAsync: saveAvatarAction } = useEndpointUploadMutation('/v1/users.setAvatar', {
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: successMessage });
		},
	});
	const { mutateAsync: saveAvatarUrlAction } = useEndpointMutation('POST', '/v1/users.setAvatar', {
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: successMessage });
		},
	});
	const { mutateAsync: resetAvatarAction } = useEndpointMutation('POST', '/v1/users.resetAvatar', {
		onSuccess: () => {
			dispatchToastMessage({ type: 'success', message: successMessage });
		},
	});

	const updateAvatar = useCallback(async () => {
		if (isAvatarReset(avatarObj)) {
			await resetAvatarAction({
				userId,
			});
			return;
		}

		if (isAvatarUrl(avatarObj)) {
			await saveAvatarUrlAction({
				userId,
				...(avatarUrl && { avatarUrl }),
			});
			return;
		}

		if (isServiceObject(avatarObj)) {
			const { blob, service } = avatarObj;
			const formData = new FormData();
			formData.append('userId', userId);
			formData.append('service', service);
			formData.append('image', blob);
			await saveAvatarAction(formData);
			return;
		}
		if (avatarObj instanceof FormData) {
			avatarObj.set('userId', userId);
			await saveAvatarAction(avatarObj);
		}
	}, [avatarObj, avatarUrl, resetAvatarAction, saveAvatarAction, saveAvatarUrlAction, successMessage, userId]);

	return updateAvatar;
};
