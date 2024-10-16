import { settings } from '../../settings/server';
import { fileUploadIsValidContentTypeFromSettings } from '../lib/restrictions';

export const fileUploadIsValidContentType = function (type: string | undefined, customWhiteList?: string): boolean {
	const blackList = settings.get<string>('FileUpload_MediaTypeBlackList');
	const whiteList = customWhiteList || settings.get<string>('FileUpload_MediaTypeWhiteList');

	return fileUploadIsValidContentTypeFromSettings(type, whiteList, blackList);
};
