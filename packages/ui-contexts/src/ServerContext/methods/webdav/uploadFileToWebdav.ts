import type { IWebdavAccount } from '@rocket.chat/core-typings';

import type { TranslationKey } from '../../../TranslationContext';

export type UploadFileToWebdav = (
	accountId: IWebdavAccount['_id'],
	fileData: Uint8Array,
	name?: string,
) => { success: boolean; message: TranslationKey };
