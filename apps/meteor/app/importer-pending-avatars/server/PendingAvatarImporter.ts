import { Users } from '@rocket.chat/models';

import { Importer, ProgressStep, Selection } from '../../importer/server';
import type { ImporterProgress } from '../../importer/server/classes/ImporterProgress';
import { setAvatarFromServiceWithValidation } from '../../lib/server/functions/setUserAvatar';

export class PendingAvatarImporter extends Importer {
	async prepareFileCount() {
		this.logger.debug('start preparing import operation');
		await super.updateProgress(ProgressStep.PREPARING_STARTED);

		const users = Users.findAllUsersWithPendingAvatar();
		const fileCount = await users.count();

		if (fileCount === 0) {
			await super.updateProgress(ProgressStep.DONE);
			return 0;
		}

		await this.updateRecord({ 'count.messages': fileCount, 'messagesstatus': null });
		await this.addCountToTotal(fileCount);

		const fileData = new Selection(this.info.name, [], [], fileCount);
		await this.updateRecord({ fileData });

		await super.updateProgress(ProgressStep.IMPORTING_FILES);
		setImmediate(() => {
			void this.startImport(fileData);
		});

		return fileCount;
	}

	async startImport(importSelection: Selection): Promise<ImporterProgress> {
		const pendingFileUserList = Users.findAllUsersWithPendingAvatar();
		try {
			for await (const user of pendingFileUserList) {
				try {
					const { _pendingAvatarUrl: url, name, _id } = user;

					try {
						if (!url?.startsWith('http')) {
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
			if (this.isCursorNotFoundError(error)) {
				this.logger.info('CursorNotFound');
				return this.startImport(importSelection);
			}

			await super.updateProgress(ProgressStep.ERROR);
			throw error;
		}

		await super.updateProgress(ProgressStep.DONE);
		return this.getProgress();
	}
}
