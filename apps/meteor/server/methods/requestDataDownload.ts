import { mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';
import path, { join } from 'path';

import type { IExportOperation, IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { ExportOperations, UserDataFiles } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { settings } from '../../app/settings/server';
import * as dataExport from '../lib/dataExport';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		requestDataDownload(params: { fullExport?: boolean }): Promise<{
			requested: boolean;
			exportOperation: IExportOperation;
			url: string | null;
			pendingOperationsBeforeMyRequest: number;
		}>;
	}
}

export const requestDataDownload = async ({
	userData,
	fullExport = false,
}: {
	userData: IUser;
	fullExport?: boolean;
}): Promise<{
	requested: boolean;
	exportOperation: IExportOperation;
	url: string | null;
	pendingOperationsBeforeMyRequest: number;
}> => {
	const currentUserData = userData;

	if (!currentUserData) {
		throw new Meteor.Error('error-invalid-user', 'Invalid user');
	}

	const userId = currentUserData._id;

	const lastOperation = await ExportOperations.findLastOperationByUser(userId, fullExport);
	const requestDay = lastOperation ? lastOperation.createdAt : new Date();
	const pendingOperationsBeforeMyRequestCount = await ExportOperations.countAllPendingBeforeMyRequest(requestDay);

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
						url: dataExport.getPath(file._id),
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

	const tempFolder = settings.get<string | undefined>('UserData_FileSystemPath')?.trim() || (await mkdtemp(join(tmpdir(), 'userData')));

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

	const assetsFolder = path.join(folderName, 'assets');

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
};

Meteor.methods<ServerMethods>({
	async requestDataDownload({ fullExport = false }) {
		const currentUserData = await Meteor.userAsync();

		if (!currentUserData) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user');
		}

		return requestDataDownload({ userData: currentUserData as IUser, fullExport });
	},
});
