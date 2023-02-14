import { WebdavAccounts } from '@rocket.chat/models';
import type { IWebdavAccount } from '@rocket.chat/core-typings';

import { getWebdavCredentials } from './getWebdavCredentials';
import { WebdavClientAdapter } from './webdavClientAdapter';

export const uploadFileToWebdav = async (accountId: IWebdavAccount['_id'], fileData: string | Buffer, name: string): Promise<void> => {
	const account = await WebdavAccounts.findOneById(accountId);
	if (!account) {
		throw new Error('error-invalid-account');
	}

	const uploadFolder = 'Rocket.Chat Uploads/';
	const buffer = Buffer.from(fileData);

	const cred = getWebdavCredentials(account);
	const client = new WebdavClientAdapter(account.serverURL, cred);
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	await client.createDirectory(uploadFolder).catch(() => {});
	await client.putFileContents(`${uploadFolder}/${name}`, buffer, { overwrite: false });
};
