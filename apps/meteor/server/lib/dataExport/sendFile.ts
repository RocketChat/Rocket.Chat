import path, { join } from 'path';
import { mkdir, mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';

import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { IUser } from '@rocket.chat/core-typings';

import { getURL } from '../../../app/utils/lib/getURL';
import { getPath } from './getPath';
import { copyFileUpload } from './copyFileUpload';
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

	const baseDir = await mkdtemp(join(tmpdir(), 'exportFile-'));

	const exportPath = baseDir;
	const assetsPath = path.join(baseDir, 'assets');

	await mkdir(exportPath, { recursive: true });
	await mkdir(assetsPath, { recursive: true });

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
		await copyFileUpload(attachmentData, assetsPath);
	}

	const exportFile = `${baseDir}-export.zip`;
	await makeZipFile(exportPath, exportFile);

	const file = await uploadZipFile(exportFile, user._id, exportType);

	const subject = TAPi18n.__('Channel_Export');

	const body = TAPi18n.__('UserDataDownload_EmailBody', {
		download_link: getURL(getPath(file._id), { cdn: false, full: true }),
	});

	sendEmail(user, subject, body);
};
