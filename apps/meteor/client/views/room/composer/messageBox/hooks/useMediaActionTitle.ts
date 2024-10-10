import { useTranslation } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';

export const useMediaActionTitle = (
	media: 'audio' | 'video',
	isPermissionDenied: boolean,
	isFileUploadEnabled: boolean,
	isMediaEnabled: boolean,
	isAllowed: boolean,
) => {
	const t = useTranslation();

	const getMediaActionTitle = useMemo(() => {
		if (isPermissionDenied) {
			return media === 'audio' ? t('Microphone_access_not_allowed') : t('Camera_access_not_allowed');
		}

		if (!isFileUploadEnabled) {
			return t('File_Upload_Disabled');
		}

		if (!isMediaEnabled) {
			return media === 'audio' ? t('Message_Audio_Recording_Disabled') : t('Message_Video_Recording_Disabled');
		}

		if (!isAllowed) {
			return t('error-not-allowed');
		}

		return media === 'audio' ? t('Audio_message') : t('Video_message');
	}, [media, isPermissionDenied, isFileUploadEnabled, isMediaEnabled, isAllowed, t]);

	return getMediaActionTitle;
};
