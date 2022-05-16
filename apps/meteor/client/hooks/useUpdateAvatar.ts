import { IUser } from '@rocket.chat/core-typings';
import { useToastMessageDispatch, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import { useMemo, useCallback } from 'react';

import { useEndpointAction } from './useEndpointAction';
import { useEndpointUpload } from './useEndpointUpload';

type AvatarUrlObj = {
	avatarUrl: string;
};

type AvatarReset = 'reset';

type AvatarServiceObject = {
	blob: Blob;
	contentType: string;
	service: string;
};

type AvatarObject = AvatarReset | AvatarUrlObj | FormData | AvatarServiceObject;

const isAvatarReset = (avatarObj: AvatarObject): avatarObj is AvatarReset => typeof avatarObj === 'string';
const isServiceObject = (avatarObj: AvatarObject): avatarObj is AvatarServiceObject => !isAvatarReset(avatarObj) && 'service' in avatarObj;
const isAvatarUrl = (avatarObj: AvatarObject): avatarObj is AvatarUrlObj =>
	!isAvatarReset(avatarObj) && 'service' && 'avatarUrl' in avatarObj;

export const useUpdateAvatar = (avatarObj: AvatarObject, userId: IUser['_id']): (() => void) => {
	const t = useTranslation();
	const avatarUrl = isAvatarUrl(avatarObj) ? avatarObj.avatarUrl : '';

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
		if (isAvatarReset(avatarObj)) {
			return resetAvatarAction();
		}
		if (isAvatarUrl(avatarObj)) {
			return saveAvatarUrlAction();
		}
		if (isServiceObject(avatarObj)) {
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
