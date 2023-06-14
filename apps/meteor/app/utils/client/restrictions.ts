import { fileUploadIsValidContentTypeFromSettings } from '../lib/restrictions';
import { settings } from '../../settings/client';

export const fileUploadIsValidContentType = function (type: string, customWhiteList?: string): boolean {
	const blackList = settings.get<string>('FileUpload_MediaTypeBlackList');
	const whiteList = customWhiteList || settings.get<string>('FileUpload_MediaTypeWhiteList');

	return fileUploadIsValidContentTypeFromSettings(type, whiteList, blackList);
};
