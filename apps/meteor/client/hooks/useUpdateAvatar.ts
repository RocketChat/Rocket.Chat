import type { AvatarObject, AvatarServiceObject, AvatarReset, AvatarUrlObj, IUser } from '@rocket.chat/core-typings';
import { useToastMessageDispatch, useMethod } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useEndpointMutation } from './useEndpointMutation';
import { useEndpointUploadMutation } from './useEndpointUploadMutation';

const isAvatarReset = (avatarObj: AvatarObject): avatarObj is AvatarReset => avatarObj === 'reset';
const isServiceObject = (avatarObj: AvatarObject): avatarObj is AvatarServiceObject =>
	!isAvatarReset(avatarObj) && typeof avatarObj === 'object' && 'service' in avatarObj;
const isAvatarUrl = (avatarObj: AvatarObject): avatarObj is AvatarUrlObj =>
	!isAvatarReset(avatarObj) && typeof avatarObj === 'object' && 'service' && 'avatarUrl' in avatarObj;

const dataUriToFile = (dataUri: string): File => {
	const [header, base64Data] = dataUri.split(',');
	const mimeMatch = header.match(/data:(.*?);/);
	const mime = mimeMatch ? mimeMatch[1] : 'image/png';
	const byteString = atob(base64Data);
	const ab = new ArrayBuffer(byteString.length);
	const ia = new Uint8Array(ab);
	for (let i = 0; i < byteString.length; i++) {
		ia[i] = byteString.charCodeAt(i);
	}

	return new File([ab], 'avatar.png', { type: mime });
};

export const useUpdateAvatar = (avatarObj: AvatarObject, userId: IUser['_id']) => {
	const { t } = useTranslation();
	const avatarUrl = isAvatarUrl(avatarObj) ? avatarObj.avatarUrl : '';

	const successMessage = t('Avatar_changed_successfully');
	const setAvatarFromService = useMethod('setAvatarFromService');

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
			if (avatarUrl.startsWith('data:')) {
				try {
					const file = dataUriToFile(avatarUrl);

					const formData = new FormData();
					formData.append('image', file, 'avatar.png');
					formData.set('userId', userId);

					await saveAvatarAction(formData);
				} catch (error) {
					dispatchToastMessage({ type: 'error', message: error });
				}
				return;
			}

			await saveAvatarUrlAction({
				userId,
				...(avatarUrl && { avatarUrl }),
			});
			return;
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
			await saveAvatarAction(avatarObj);
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
