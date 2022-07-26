import fs from 'fs';
import path from 'path';

import mkdirp from 'mkdirp';
import { Meteor } from 'meteor/meteor';
import { ExportOperations, UserDataFiles } from '@rocket.chat/models';
import type { IExportOperation, IUser } from '@rocket.chat/core-typings';

import { settings } from '../../app/settings/server';
import { getPath } from '../lib/dataExport/getPath';

let tempFolder = '/tmp/userData';
if (settings.get<string | undefined>('UserData_FileSystemPath')?.trim() !== '') {
	tempFolder = settings.get('UserData_FileSystemPath');
}

Meteor.methods({
	async requestDataDownload({ fullExport = false }) {
		const currentUserData = Meteor.user() as IUser | null;

		if (!currentUserData) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user');
		}

		const userId = currentUserData._id;

		const lastOperation = await ExportOperations.findLastOperationByUser(userId, fullExport);
		const requestDay = lastOperation ? lastOperation.createdAt : new Date();
		const pendingOperationsBeforeMyRequestCount = await ExportOperations.findAllPendingBeforeMyRequest(requestDay).count();

		if (lastOperation) {
			const yesterday = new Date();
			yesterday.setUTCDate(yesterday.getUTCDate() - 1);

			if (lastOperation.createdAt > yesterday) {
				if (lastOperation.status === 'completed') {
					const file = lastOperation.fileId
						? await UserDataFiles.findOneById(lastOperation.fileId)
						: await UserDataFiles.findLastFileByUser(userId);
					if (file) {
						return {
							requested: false,
							exportOperation: lastOperation,
							url: getPath(file._id),
							pendingOperationsBeforeMyRequest: pendingOperationsBeforeMyRequestCount,
						};
					}
				}

				return {
					requested: false,
					exportOperation: lastOperation,
					url: null,
					pendingOperationsBeforeMyRequest: pendingOperationsBeforeMyRequestCount,
				};
			}
		}

		if (!fs.existsSync(tempFolder)) {
			mkdirp.sync(tempFolder);
		}

		const exportOperation = {
			status: 'preparing',
			userId: currentUserData._id,
			roomList: undefined,
			fileList: [],
			generatedFile: undefined,
			fullExport,
			userData: currentUserData,
		} as unknown as IExportOperation; // @todo yikes!

		const id = await ExportOperations.create(exportOperation);
		exportOperation._id = id;

		const folderName = path.join(tempFolder, id);
		if (!fs.existsSync(folderName)) {
			mkdirp.sync(folderName);
		}

		const assetsFolder = path.join(folderName, 'assets');
		if (!fs.existsSync(assetsFolder)) {
			mkdirp.sync(assetsFolder);
		}

		exportOperation.exportPath = folderName;
		exportOperation.assetsPath = assetsFolder;
		exportOperation.status = 'pending';

		await ExportOperations.updateOperation(exportOperation);

		return {
			requested: true,
			exportOperation,
			url: null,
			pendingOperationsBeforeMyRequest: pendingOperationsBeforeMyRequestCount,
		};
	},
});
