// export type AddWebdavAccountMethod = (data: IWebdavAccountPayload) => void;
import { TranslationKey } from '@rocket.chat/ui-contexts';
import { IWebdavAccount } from '@rocket.chat/core-typings';

export type UploadFileToWebdav = (
	accountId: IWebdavAccount['_id'],
	fileData: Uint8Array,
	name?: string,
) => { success: boolean; message: TranslationKey };
