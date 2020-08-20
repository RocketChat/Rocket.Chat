import path from 'path';

import moment from 'moment';
import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import mkdirp from 'mkdirp';

import * as Mailer from '../../app/mailer';
import { Messages, Users } from '../../app/models/server';
import { settings } from '../../app/settings/server';
import { Message } from '../../app/ui-utils/server';
import {
	exportRoomMessages,
	exportRoomMessagesToFile,
	copyFile,
	isExportComplete,
	loadUserSubscriptions,
	getRoomData,
	makeZipFile,
	sendEmail,
	uploadZipFile,
} from '../../app/user-data-download/server/cronProcessDownloads';
import { IUser } from '../../definition/IUser';

type ExportEmail = {
	rid: string;
	to_users: string[];
	to_emails: string;
	subject: string;
	messages: string[];
	language: string;
}

type ExportFile = {
	rid: string;
	dateFrom: Date;
	dateTo: Date;
	format: 'html' | 'json';
}

type ExportInput = {
	type: 'email';
	data: ExportEmail;
} | {
	type: 'file';
	data: ExportFile;
};

const sendViaEmail = (data: ExportEmail, user: IUser): void => {
	const emails = _.compact(data.to_emails.trim().split(','));
	const missing = [];
	if (data.to_users.length > 0) {
		_.each(data.to_users, (username) => {
			const user = Users.findOneByUsernameIgnoringCase(username, {});
			if (user && user.emails && user.emails[0] && user.emails[0].address) {
				emails.push(user.emails[0].address);
			} else {
				missing.push(username);
			}
		});
	}
	_.each(emails, (email) => {
		if (!Mailer.checkAddressFormat(email.trim())) {
			throw new Error('error-invalid-email');
		}
	});

	const email = user.emails && user.emails[0] && user.emails[0].address;
	const lang = typeof data.language !== 'undefined' ? data.language.split('-').shift().toLowerCase() : '';
	if (lang !== 'en') {
		const localeFn = Meteor.call('loadLocale', lang);
		if (localeFn) {
			Function(localeFn).call({ moment });
			moment.locale(lang);
		}
	}

	const html = Messages.findByRoomIdAndMessageIds(data.rid, data.messages, {
		sort: {	ts: 1 },
	}).map(function(message: any) {
		const dateTime = moment(message.ts).locale(lang).format('L LT');
		return `<p style='margin-bottom: 5px'><b>${ message.u.username }</b> <span style='color: #aaa; font-size: 12px'>${ dateTime }</span><br/>${ Message.parse(message, data.language) }</p>`;
	}).join('');

	Mailer.send({
		to: emails,
		from: settings.get('From_Email'),
		replyTo: email,
		subject: data.subject,
		html,
	} as any);
};

export const sendFile = async (data: ExportFile, user: IUser): Promise<void> => {
	const exportType = data.format;

	const baseDir = `/tmp/sendFile-${ Random.id() }`;

	const exportOperation = {
		exportPath: baseDir,
		assetsPath: path.join(baseDir, 'assets'),
	} as any;

	mkdirp.sync(exportOperation.exportPath);
	mkdirp.sync(exportOperation.assetsPath);

	console.log('get room');
	const roomData = getRoomData(data.rid);
	console.log('get room', roomData);

	roomData.targetFile = `${ (data.format === 'json' && roomData.roomName) || roomData.roomId }.${ data.format }`;

	console.log('exportType ->', exportType);

	const { fileList } = await exportRoomMessagesToFile(
		exportOperation.exportPath,
		exportOperation.assetsPath,
		exportType,
		[roomData],
		user,
		{},
		false,
	);

	console.log('copy attachments', fileList);
	fileList.forEach((attachmentData: any) => {
		copyFile(attachmentData, exportOperation.assetsPath);
	});

	console.log('make zip', exportOperation.exportPath);
	const exportFile = `${ baseDir }-export.zip`;
	await makeZipFile(exportOperation.exportPath, exportFile);

	console.log('upload zip', exportFile, exportOperation);
	const file = await uploadZipFile(exportFile, user._id, exportType);

	console.log('send email');
	const subject = TAPi18n.__('UserDataDownload_EmailSubject');
	// eslint-disable-next-line @typescript-eslint/camelcase
	const body = TAPi18n.__('UserDataDownload_EmailBody', { download_link: file.url });

	sendEmail(user, subject, body);
};

export async function channelExport(data: ExportInput, user: IUser): Promise<void> {
	if (data.type === 'email') {
		return sendViaEmail(data.data, user);
	}

	return sendFile(data.data, user);
}

// Meteor.methods({ sendFile });
