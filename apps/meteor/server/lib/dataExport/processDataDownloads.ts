import { createWriteStream } from 'fs';
import { promisify } from 'util';
import { access, mkdir, rm, writeFile } from 'fs/promises';

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
import { copyFileUpload } from './copyFileUpload';
import { uploadZipFile } from './uploadZipFile';
import { exportRoomMessagesToFile } from './exportRoomMessagesToFile';

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

const generateUserFile = async (exportOperation: IExportOperation, userData?: IUser) => {
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

	if (exportOperation.fullExport) {
		await writeFile(fileName, JSON.stringify(dataToSave), { encoding: 'utf8' });

		exportOperation.generatedUserFile = true;
		return;
	}

	const stream = createWriteStream(fileName, { encoding: 'utf8' });

	stream.write('<!DOCTYPE html>\n');
	stream.write('<meta http-equiv="content-type" content="text/html; charset=utf-8">\n');
	for (const [key, value] of Object.entries(dataToSave)) {
		stream.write(`<p><strong>${key}</strong>:`);
		if (typeof value === 'string') {
			stream.write(value);
		} else if (Array.isArray(value)) {
			stream.write('<br/>');

			for (const item of value) {
				stream.write(`${item}<br/>`);
			}
		}

		stream.write('</p>\n');
	}

	await promisify(stream.close)();
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

const generateChannelsFile = async (type: 'json' | 'html', exportPath: string, exportOperation: IExportOperation) => {
	if (type !== 'json') {
		return;
	}

	const fileName = joinPath(exportPath, 'channels.json');
	await writeFile(
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
			await generateUserFile(exportOperation, exportOperation.userData);
		}

		if (!exportOperation.generatedAvatar) {
			await generateUserAvatarFile(exportOperation, exportOperation.userData);
		}

		if (exportOperation.status === 'exporting-rooms') {
			await generateChannelsFile(exportType, exportOperation.exportPath, exportOperation);

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
		const zipFolder = settings.get<string>('UserData_FileSystemZipPath')?.trim() || '/tmp/zipFiles';

		if (exportOperation.status === 'downloading') {
			for await (const attachmentData of exportOperation.fileList) {
				await copyFileUpload(attachmentData, exportOperation.assetsPath);
			}

			const targetFile = joinPath(zipFolder, `${generatedFileName}.zip`);
			await rm(targetFile, { force: true });

			exportOperation.status = 'compressing';
		}

		if (exportOperation.status === 'compressing') {
			await mkdir(zipFolder, { recursive: true });

			exportOperation.generatedFile = joinPath(zipFolder, `${generatedFileName}.zip`);
			try {
				await access(exportOperation.generatedFile);
			} catch (error) {
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
