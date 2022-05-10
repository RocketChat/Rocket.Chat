import { Meteor } from 'meteor/meteor';

import { Base, ProgressStep, Selection } from '../../importer/server';
import { Users } from '../../models';

export class PendingAvatarImporter extends Base {
	prepareFileCount() {
		this.logger.debug('start preparing import operation');
		super.updateProgress(ProgressStep.PREPARING_STARTED);

		const users = Users.findAllUsersWithPendingAvatar();
		const fileCount = users.count();

		if (fileCount === 0) {
			super.updateProgress(ProgressStep.DONE);
			return 0;
		}

		this.updateRecord({ 'count.messages': fileCount, 'messagesstatus': null });
		this.addCountToTotal(fileCount);

		const fileData = new Selection(this.name, [], [], fileCount);
		this.updateRecord({ fileData });

		super.updateProgress(ProgressStep.IMPORTING_FILES);
		Meteor.defer(() => {
			this.startImport(fileData);
		});

		return fileCount;
	}

	startImport() {
		const pendingFileUserList = Users.findAllUsersWithPendingAvatar();
		try {
			pendingFileUserList.forEach((user) => {
				try {
					const { _pendingAvatarUrl: url, name, _id } = user;

					try {
						if (!url || !url.startsWith('http')) {
							return;
						}

						Meteor.runAsUser(_id, () => {
							try {
								Meteor.call('setAvatarFromService', url, undefined, 'url');
								Users.update({ _id }, { $unset: { _pendingAvatarUrl: '' } });
							} catch (error) {
								this.logger.warn(`Failed to set ${name}'s avatar from url ${url}`);
							}
						});
					} finally {
						this.addCountCompleted(1);
					}
				} catch (error) {
					this.logger.error(error);
				}
			});
		} catch (error) {
			// If the cursor expired, restart the method
			if (error && error.codeName === 'CursorNotFound') {
				this.logger.info('CursorNotFound');
				return this.startImport();
			}

			super.updateProgress(ProgressStep.ERROR);
			throw error;
		}

		super.updateProgress(ProgressStep.DONE);
		return this.getProgress();
	}
}
