import { settings } from '../../../client/lib/settings';
import { fileUploadIsValidContentTypeFromSettings } from '../lib/restrictions';

export const fileUploadIsValidContentType = function (type: string | undefined, customWhiteList?: string): boolean {
	const blackList = settings.peek<string>('FileUpload_MediaTypeBlackList') ?? 'image/svg+xml';
	const whiteList = customWhiteList ?? settings.peek<string>('FileUpload_MediaTypeWhiteList') ?? '';

	return fileUploadIsValidContentTypeFromSettings(type, whiteList, blackList);
};
