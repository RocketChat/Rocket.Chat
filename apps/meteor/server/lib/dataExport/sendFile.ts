import { mkdir, mkdtemp } from 'fs/promises';
import { tmpdir } from 'os';
import path, { join } from 'path';

import type { IUser } from '@rocket.chat/core-typings';

import { getURL } from '../../../app/utils/server/getURL';
import { i18n } from '../i18n';
import { copyFileUpload } from './copyFileUpload';
import { exportRoomMessagesToFile } from './exportRoomMessagesToFile';
import { getPath } from './getPath';
import { getRoomData } from './getRoomData';
import { makeZipFile } from './makeZipFile';
import { sendEmail } from './sendEmail';
import { uploadZipFile } from './uploadZipFile';

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

	const roomData = await getRoomData(data.rid);

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

	const subject = i18n.t('Channel_Export');

	const body = i18n.t('UserDataDownload_EmailBody', {
		download_link: getURL(getPath(file._id), { cdn: false, full: true }),
	});

	await sendEmail(user, subject, body);
};
