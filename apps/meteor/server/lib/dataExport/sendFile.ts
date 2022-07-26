import path from 'path';

import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import mkdirp from 'mkdirp';
import type { IUser } from '@rocket.chat/core-typings';

import { getURL } from '../../../app/utils/lib/getURL';
import { DataExport } from '../DataExport';
import { copyFile } from './copyFile';
import { getRoomData } from './getRoomData';
import { exportRoomMessagesToFile } from './exportRoomMessagesToFile';
import { makeZipFile } from './makeZipFile';
import { uploadZipFile } from './uploadZipFile';
import { sendEmail } from './sendEmail';

type ExportFile = {
	rid: string;
	dateFrom: Date;
	dateTo: Date;
	format: 'html' | 'json';
};

export const sendFile = async (data: ExportFile, user: IUser): Promise<void> => {
	const exportType = data.format;

	const baseDir = `/tmp/exportFile-${Random.id()}`;

	const exportPath = baseDir;
	const assetsPath = path.join(baseDir, 'assets');

	mkdirp.sync(exportPath);
	mkdirp.sync(assetsPath);

	const roomData = getRoomData(data.rid);

	roomData.targetFile = `${(data.format === 'json' && roomData.roomName) || roomData.roomId}.${data.format}`;

	const fullFileList: any[] = [];

	const roomsToExport = [roomData];

	const filter =
		!data.dateFrom && !data.dateTo
			? {}
			: {
					ts: {
						...(data.dateFrom && { $gte: data.dateFrom }),
						...(data.dateTo && { $lte: data.dateTo }),
					},
			  };

	const exportMessages = async (): Promise<void> => {
		const { fileList } = await exportRoomMessagesToFile(exportPath, assetsPath, exportType, roomsToExport, user, filter, {}, false);

		fullFileList.push(...fileList);

		const [roomData] = roomsToExport;

		if (roomData.status !== 'completed') {
			await exportMessages();
		}
	};

	await exportMessages();

	for await (const attachmentData of fullFileList) {
		await copyFile(attachmentData, assetsPath);
	}

	const exportFile = `${baseDir}-export.zip`;
	await makeZipFile(exportPath, exportFile);

	const file = await uploadZipFile(exportFile, user._id, exportType);

	const subject = TAPi18n.__('Channel_Export');

	const body = TAPi18n.__('UserDataDownload_EmailBody', {
		download_link: getURL(DataExport.getPath(file._id), { cdn: false, full: true }),
	});

	sendEmail(user, subject, body);
};
