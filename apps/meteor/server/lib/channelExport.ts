import path from 'path';

import moment from 'moment';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import mkdirp from 'mkdirp';
import type { IUser } from '@rocket.chat/core-typings';

import * as Mailer from '../../app/mailer';
import { Messages, Users } from '../../app/models/server';
import { settings } from '../../app/settings/server';
import { Message } from '../../app/ui-utils/server';
import {
	exportRoomMessagesToFile,
	copyFile,
	getRoomData,
	makeZipFile,
	sendEmail,
	uploadZipFile,
} from '../../app/user-data-download/server/cronProcessDownloads';
import { getMomentLocale } from './getMomentLocale';
import { getURL } from '../../app/utils/lib/getURL';
import { DataExport } from '../../app/user-data-download/server/DataExport';

type ExportEmail = {
	rid: string;
	toUsers: string[];
	toEmails: string[];
	subject: string;
	messages: string[];
	language: string;
};

type ExportFile = {
	rid: string;
	dateFrom: Date;
	dateTo: Date;
	format: 'html' | 'json';
};

type ExportInput =
	| {
			type: 'email';
			data: ExportEmail;
	  }
	| {
			type: 'file';
			data: ExportFile;
	  };

type ISentViaEmail = {
	missing: string[];
};

export const sendViaEmail = (data: ExportEmail, user: IUser): ISentViaEmail => {
	const emails = data.toEmails.map((email) => email.trim()).filter(Boolean);

	const missing = [...data.toUsers].filter(Boolean);

	Users.findUsersByUsernames(data.toUsers, {
		fields: { 'username': 1, 'emails.address': 1 },
	}).forEach((user: IUser) => {
		const emailAddress = user.emails?.[0].address;

		if (!emailAddress) {
			return;
		}

		if (!Mailer.checkAddressFormat(emailAddress)) {
			throw new Error('error-invalid-email');
		}

		const found = missing.indexOf(String(user.username));
		if (found !== -1) {
			missing.splice(found, 1);
		}

		emails.push(emailAddress);
	});

	const email = user.emails?.[0]?.address;
	const lang = data.language || user.language || 'en';

	const localMoment = moment();

	if (lang !== 'en') {
		const localeFn = getMomentLocale(lang);
		if (localeFn) {
			Function(localeFn).call({ moment });
			localMoment.locale(lang);
		}
	}

	const html = Messages.findByRoomIdAndMessageIds(data.rid, data.messages, {
		sort: { ts: 1 },
	})
		.fetch()
		.map(function (message: any) {
			const dateTime = moment(message.ts).locale(lang).format('L LT');
			return `<p style='margin-bottom: 5px'><b>${
				message.u.username
			}</b> <span style='color: #aaa; font-size: 12px'>${dateTime}</span><br/>${Message.parse(message, data.language)}</p>`;
		})
		.join('');

	Mailer.send({
		to: emails,
		from: settings.get('From_Email'),
		replyTo: email,
		subject: data.subject,
		html,
	} as any);

	return { missing };
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
		// eslint-disable-next-line @typescript-eslint/camelcase
		download_link: getURL(DataExport.getPath(file._id), { cdn: false, full: true }),
	});

	sendEmail(user, subject, body);
};

export async function channelExport(data: ExportInput, user: IUser): Promise<ISentViaEmail | void> {
	if (data.type === 'email') {
		return sendViaEmail(data.data, user);
	}

	return sendFile(data.data, user);
}
