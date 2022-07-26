import fs from 'fs';
import util from 'util';

import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { Avatars, ExportOperations, UserDataFiles } from '@rocket.chat/models';
import type { IExportOperation, ISubscription, IUser, RoomType } from '@rocket.chat/core-typings';
import type { FindCursor } from 'mongodb';

import { settings } from '../../../app/settings/server';
import { Subscriptions } from '../../../app/models/server';
import { FileUpload } from '../../../app/file-upload/server';
import { getPath } from './getPath';
import { joinPath } from '../fileUtils';
import { getURL } from '../../../app/utils/lib/getURL';
import { getRoomData } from './getRoomData';
import { sendEmail } from './sendEmail';
import { makeZipFile } from './makeZipFile';
import { copyFile } from './copyFile';
import { uploadZipFile } from './uploadZipFile';
import { exportRoomMessagesToFile } from './exportRoomMessagesToFile';
import { startFile } from './startFile';
import { writeToFile } from './writeToFile';
import { createDir } from './createDir';

const fsExists = util.promisify(fs.exists);
const fsUnlink = util.promisify(fs.unlink);

let zipFolder = '/tmp/zipFiles';
if (settings.get<string>('UserData_FileSystemZipPath')) {
	if (settings.get<string>('UserData_FileSystemZipPath').trim() !== '') {
		zipFolder = settings.get('UserData_FileSystemZipPath');
	}
}

const loadUserSubscriptions = (_exportOperation: IExportOperation, fileType: 'json' | 'html', userId: IUser['_id']) => {
	const roomList: (
		| {
				roomId: string;
				roomName: string;
				userId: string | undefined;
				exportedCount: number;
				status: string;
				type: RoomType;
				targetFile: string;
		  }
		| Record<string, never>
	)[] = [];

	const cursor: FindCursor<ISubscription> = Subscriptions.findByUserId(userId);
	cursor.forEach((subscription) => {
		const roomData = getRoomData(subscription.rid, userId);
		roomData.targetFile = `${(fileType === 'json' && roomData.roomName) || subscription.rid}.${fileType}`;

		roomList.push(roomData);
	});

	return roomList;
};

const generateUserFile = (exportOperation: IExportOperation, userData?: IUser) => {
	if (!userData) {
		return;
	}

	const { username, name, statusText, emails, roles, services } = userData;

	const dataToSave = {
		username,
		name,
		statusText,
		emails: emails?.map(({ address }) => address),
		roles,
		services: services ? Object.keys(services) : undefined,
	};

	const fileName = joinPath(exportOperation.exportPath, exportOperation.fullExport ? 'user.json' : 'user.html');
	startFile(fileName, '');

	if (exportOperation.fullExport) {
		writeToFile(fileName, JSON.stringify(dataToSave));

		exportOperation.generatedUserFile = true;
		return;
	}

	writeToFile(fileName, '<meta http-equiv="content-type" content="text/html; charset=utf-8">');
	for (const [key, value] of Object.entries(dataToSave)) {
		writeToFile(fileName, `<p><strong>${key}</strong>:`);
		if (typeof value === 'string') {
			writeToFile(fileName, value);
		} else if (Array.isArray(value)) {
			writeToFile(fileName, '<br/>');

			for (const item of value) {
				writeToFile(fileName, `${item}<br/>`);
			}
		}

		writeToFile(fileName, '</p>');
	}
};

const generateUserAvatarFile = async (exportOperation: IExportOperation, userData?: IUser) => {
	if (!userData?.username) {
		return;
	}

	const file = await Avatars.findOneByName(userData.username);
	if (!file) {
		return;
	}

	const filePath = joinPath(exportOperation.exportPath, 'avatar');
	if (FileUpload.copy(file, filePath)) {
		exportOperation.generatedAvatar = true;
	}
};

const generateChannelsFile = (type: 'json' | 'html', exportPath: string, exportOperation: IExportOperation) => {
	if (type !== 'json') {
		return;
	}

	const fileName = joinPath(exportPath, 'channels.json');
	startFile(
		fileName,
		exportOperation.roomList
			?.map((roomData) =>
				JSON.stringify({
					roomId: roomData.roomId,
					roomName: roomData.roomName,
					type: roomData.type,
				}),
			)
			?.join('\n') ?? '',
	);
};

const isExportComplete = (exportOperation: IExportOperation) => {
	const incomplete = exportOperation.roomList?.some((exportOpRoomData) => exportOpRoomData.status !== 'completed') ?? false;

	return !incomplete;
};

const continueExportOperation = async function (exportOperation: IExportOperation): Promise<void> {
	if (exportOperation.status === 'completed') {
		return;
	}

	const exportType = exportOperation.fullExport ? 'json' : 'html';

	if (!exportOperation.roomList) {
		exportOperation.roomList = loadUserSubscriptions(exportOperation, exportType, exportOperation.userId);

		if (exportOperation.fullExport) {
			exportOperation.status = 'exporting-rooms';
		} else {
			exportOperation.status = 'exporting';
		}
	}

	try {
		if (!exportOperation.generatedUserFile) {
			generateUserFile(exportOperation, exportOperation.userData);
		}

		if (!exportOperation.generatedAvatar) {
			await generateUserAvatarFile(exportOperation, exportOperation.userData);
		}

		if (exportOperation.status === 'exporting-rooms') {
			generateChannelsFile(exportType, exportOperation.exportPath, exportOperation);

			exportOperation.status = 'exporting';
		}

		// Run every room on every request, to avoid missing new messages on the rooms that finished first.
		if (exportOperation.status === 'exporting') {
			const { fileList } = await exportRoomMessagesToFile(
				exportOperation.exportPath,
				exportOperation.assetsPath,
				exportType,
				exportOperation.roomList,
				exportOperation.userData,
				{},
				exportOperation.userNameTable,
			);
			if (!exportOperation.fileList) {
				exportOperation.fileList = [];
			}
			exportOperation.fileList.push(...fileList);

			if (isExportComplete(exportOperation)) {
				exportOperation.status = 'downloading';
			}
		}

		const generatedFileName = uuidv4();

		if (exportOperation.status === 'downloading') {
			for await (const attachmentData of exportOperation.fileList) {
				await copyFile(attachmentData, exportOperation.assetsPath);
			}

			const targetFile = joinPath(zipFolder, `${generatedFileName}.zip`);
			if (await fsExists(targetFile)) {
				await fsUnlink(targetFile);
			}

			exportOperation.status = 'compressing';
		}

		if (exportOperation.status === 'compressing') {
			createDir(zipFolder);

			exportOperation.generatedFile = joinPath(zipFolder, `${generatedFileName}.zip`);
			if (!(await fsExists(exportOperation.generatedFile))) {
				await makeZipFile(exportOperation.exportPath, exportOperation.generatedFile);
			}

			exportOperation.status = 'uploading';
		}

		if (exportOperation.status === 'uploading') {
			if (!exportOperation.generatedFile) {
				throw new Error('No generated file');
			}

			const { _id: fileId } = await uploadZipFile(exportOperation.generatedFile, exportOperation.userId, exportType);
			exportOperation.fileId = fileId;

			exportOperation.status = 'completed';
			await ExportOperations.updateOperation(exportOperation);
		}

		await ExportOperations.updateOperation(exportOperation);
	} catch (e) {
		console.error(e);
	}
};

export async function processDataDownloads(): Promise<void> {
	const operation = await ExportOperations.findOnePending();
	if (!operation) {
		return;
	}

	if (operation.status === 'completed') {
		return;
	}

	if (operation.status !== 'pending') {
		// If the operation has started but was not updated in over a day, then skip it
		if (operation._updatedAt && moment().diff(moment(operation._updatedAt), 'days') > 1) {
			operation.status = 'skipped';
			await ExportOperations.updateOperation(operation);
			return processDataDownloads();
		}
	}

	await continueExportOperation(operation);
	await ExportOperations.updateOperation(operation);

	if (operation.status === 'completed') {
		const file = operation.fileId
			? await UserDataFiles.findOneById(operation.fileId)
			: await UserDataFiles.findLastFileByUser(operation.userId);
		if (!file) {
			return;
		}

		const subject = TAPi18n.__('UserDataDownload_EmailSubject');
		const body = TAPi18n.__('UserDataDownload_EmailBody', {
			download_link: getURL(getPath(file._id), { cdn: false, full: true }),
		});

		sendEmail(operation.userData, subject, body);
	}
}
