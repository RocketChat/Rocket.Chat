import { Users } from '@rocket.chat/models';

import { Base, ProgressStep, Selection } from '../../importer/server';
import { setAvatarFromServiceWithValidation } from '../../lib/server/functions/setUserAvatar';

export class PendingAvatarImporter extends Base {
	async prepareFileCount() {
		this.logger.debug('start preparing import operation');
		await super.updateProgress(ProgressStep.PREPARING_STARTED);

		const users = await Users.findAllUsersWithPendingAvatar();
		const fileCount = await users.count();

		if (fileCount === 0) {
			await super.updateProgress(ProgressStep.DONE);
			return 0;
		}

		await this.updateRecord({ 'count.messages': fileCount, 'messagesstatus': null });
		await this.addCountToTotal(fileCount);

		const fileData = new Selection(this.name, [], [], fileCount);
		await this.updateRecord({ fileData });

		await super.updateProgress(ProgressStep.IMPORTING_FILES);
		setImmediate(() => {
			this.startImport(fileData);
		});

		return fileCount;
	}

	async startImport() {
		const pendingFileUserList = await Users.findAllUsersWithPendingAvatar();
		try {
			for await (const user of pendingFileUserList) {
				try {
					const { _pendingAvatarUrl: url, name, _id } = user;

					try {
						if (!url || !url.startsWith('http')) {
							continue;
						}

						try {
							await setAvatarFromServiceWithValidation(_id, url, undefined, 'url');
							await Users.updateOne({ _id }, { $unset: { _pendingAvatarUrl: '' } });
						} catch (error) {
							this.logger.warn(`Failed to set ${name}'s avatar from url ${url}`);
						}
					} finally {
						await this.addCountCompleted(1);
					}
				} catch (error) {
					this.logger.error(error);
				}
			}
		} catch (error) {
			// If the cursor expired, restart the method
			if (error && error.codeName === 'CursorNotFound') {
				this.logger.info('CursorNotFound');
				return this.startImport();
			}

			await super.updateProgress(ProgressStep.ERROR);
			throw error;
		}

		await super.updateProgress(ProgressStep.DONE);
		return this.getProgress();
	}
}
