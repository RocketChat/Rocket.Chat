import { MeteorError } from '@rocket.chat/core-services';
import type { IWebdavAccount } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import type { ServerMethods, TranslationKey } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';
import { uploadFileToWebdav } from '../lib/uploadFileToWebdav';

const logger = new Logger('WebDAV_Upload');

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		uploadFileToWebdav(
			accountId: IWebdavAccount['_id'],
			fileData: string | Buffer | ArrayBuffer,
			name: string,
		): { success: boolean; message?: TranslationKey };
	}
}

Meteor.methods<ServerMethods>({
	async uploadFileToWebdav(accountId, fileData, name) {
		if (!Meteor.userId()) {
			throw new MeteorError('error-invalid-user', 'Invalid User', {
				method: 'uploadFileToWebdav',
			});
		}

		if (!settings.get('Webdav_Integration_Enabled')) {
			throw new MeteorError('error-not-allowed', 'WebDAV Integration Not Allowed', {
				method: 'uploadFileToWebdav',
			});
		}

		try {
			await uploadFileToWebdav(accountId, fileData instanceof ArrayBuffer ? Buffer.from(fileData) : fileData, name);
			return { success: true };
		} catch (error: any) {
			if (typeof error === 'object' && error instanceof Error && error.name === 'error-invalid-account') {
				throw new MeteorError(error.name, 'Invalid WebDAV Account', {
					method: 'uploadFileToWebdav',
				});
			}

			logger.error(error);

			if (error.response) {
				const { status } = error.response;
				if (status === 404) {
					return { success: false, message: 'webdav-server-not-found' };
				}
				if (status === 401) {
					return { success: false, message: 'error-invalid-account' };
				}
				if (status === 412) {
					return { success: false, message: 'Duplicate_file_name_found' };
				}
			}
			return { success: false, message: 'FileUpload_Error' };
		}
	},
});
