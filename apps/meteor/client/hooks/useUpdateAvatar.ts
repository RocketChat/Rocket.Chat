import type { AvatarObject, AvatarServiceObject, AvatarReset, AvatarUrlObj, IUser } from '@rocket.chat/core-typings';
import { useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { useEndpointAction } from './useEndpointAction';
import { useEndpointUpload } from './useEndpointUpload';

const isAvatarReset = (avatarObj: AvatarObject): avatarObj is AvatarReset => avatarObj === 'reset';
const isServiceObject = (avatarObj: AvatarObject): avatarObj is AvatarServiceObject =>
	!isAvatarReset(avatarObj) && typeof avatarObj === 'object' && 'service' in avatarObj;
const isAvatarUrl = (avatarObj: AvatarObject): avatarObj is AvatarUrlObj =>
	!isAvatarReset(avatarObj) && typeof avatarObj === 'object' && 'service' && 'avatarUrl' in avatarObj;

export const useUpdateAvatar = (
	avatarObj: AvatarObject,
	userId: IUser['_id'],
): (() => Promise<{ success: boolean } | null | undefined>) => {
	const t = useTranslation();
	const avatarUrl = isAvatarUrl(avatarObj) ? avatarObj.avatarUrl : '';

	const successMessage = t('Avatar_changed_successfully');
	const setAvatarFromService = useMethod('setAvatarFromService');

	const dispatchToastMessage = useToastMessageDispatch();

	const saveAvatarAction = useEndpointUpload('/v1/users.setAvatar', successMessage);
	const saveAvatarUrlAction = useEndpointAction('POST', '/v1/users.setAvatar', { successMessage });
	const resetAvatarAction = useEndpointAction('POST', '/v1/users.resetAvatar', { successMessage });

	const updateAvatar = useCallback(async () => {
		if (isAvatarReset(avatarObj)) {
			return resetAvatarAction({
				userId,
			});
		}
		if (isAvatarUrl(avatarObj)) {
			return saveAvatarUrlAction({
				userId,
				...(avatarUrl && { avatarUrl }),
			});
		}
		if (isServiceObject(avatarObj)) {
			const { blob, contentType, service } = avatarObj;
			try {
				await setAvatarFromService(blob, contentType, service);
				dispatchToastMessage({ type: 'success', message: successMessage });
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
		avatarUrl,
		dispatchToastMessage,
		resetAvatarAction,
		saveAvatarAction,
		saveAvatarUrlAction,
		setAvatarFromService,
		successMessage,
		userId,
	]);

	return updateAvatar;
};
