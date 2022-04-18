import { useMemo, useCallback } from 'react';

import { useMethod } from '../contexts/ServerContext';
import { useToastMessageDispatch } from '../contexts/ToastMessagesContext';
import { useTranslation } from '../contexts/TranslationContext';
import { useEndpointAction } from './useEndpointAction';
import { useEndpointUpload } from './useEndpointUpload';

export const useUpdateAvatar = (avatarObj, userId) => {
	const t = useTranslation();
	const avatarUrl = avatarObj?.avatarUrl;

	const successText = t('Avatar_changed_successfully');
	const setAvatarFromService = useMethod('setAvatarFromService');

	const dispatchToastMessage = useToastMessageDispatch();

	const saveAvatarQuery = useMemo(
		() => ({
			userId,
			...(avatarUrl && { avatarUrl }),
		}),
		[avatarUrl, userId],
	);

	const resetAvatarQuery = useMemo(
		() => ({
			userId,
		}),
		[userId],
	);

	const saveAvatarAction = useEndpointUpload('users.setAvatar', saveAvatarQuery, successText);
	const saveAvatarUrlAction = useEndpointAction('POST', 'users.setAvatar', saveAvatarQuery, successText);
	const resetAvatarAction = useEndpointAction('POST', 'users.resetAvatar', resetAvatarQuery, successText);

	const updateAvatar = useCallback(async () => {
		if (avatarObj === 'reset') {
			return resetAvatarAction();
		}
		if (avatarObj.avatarUrl) {
			return saveAvatarUrlAction();
		}
		if (avatarObj.service) {
			const { blob, contentType, service } = avatarObj;
			try {
				await setAvatarFromService(blob, contentType, service);
				dispatchToastMessage({ type: 'success', message: successText });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			}
			return;
		}
		if (avatarObj instanceof FormData) {
			avatarObj.set('userId', userId);
			return saveAvatarAction(avatarObj);
		}
	}, [
		avatarObj,
		dispatchToastMessage,
		resetAvatarAction,
		saveAvatarAction,
		saveAvatarUrlAction,
		setAvatarFromService,
		successText,
		userId,
	]);

	return updateAvatar;
};
