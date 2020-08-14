import moment from 'moment';
import _ from 'underscore';
import { Meteor } from 'meteor/meteor';
import mkdirp from 'mkdirp';

import * as Mailer from '../../app/mailer';
import { Messages, Users } from '../../app/models/server';
import { settings } from '../../app/settings/server';
import { Message } from '../../app/ui-utils/server';
import {
	continueExportingRoom,
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
	type: 'html' | 'json';
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

const sendFile = async (data: ExportFile, user: IUser): Promise<void> => {
	const exportType = data.type;

	const baseDir = `/tmp/sendFile-${ data.rid }-${ user._id }`;

	const exportOperation = {
		exportPath: `${ baseDir }/data`,
		assetsPath: `${ baseDir }/assets`,
	} as any;

	mkdirp.sync(exportOperation.exportPath);
	mkdirp.sync(exportOperation.assetsPath);

	console.log('get room');
	const roomData = getRoomData(data.rid);
	console.log('get room', roomData);

	roomData.targetFile = `${ (data.type === 'json' && roomData.roomName) || roomData.roomId }.${ data.type }`;

	const attachmentsList: never[] = [];

	const getMessages = async (): Promise<void> => {
		const skip = roomData.exportedCount;

		console.log('getMessages', skip, roomData.exportedCount);

		const {
			total,
			exported,
			attachments,
		} = await continueExportingRoom(data.rid, exportType, skip, 1000, exportOperation, roomData);

		attachmentsList.push(...attachments);

		roomData.exportedCount += exported;

		console.log('getMessages done', total, exported, roomData.exportedCount);

		if (total > roomData.exportedCount) {
			return getMessages();
		}
	};

	await getMessages();

	console.log('copy attachments');
	attachmentsList.forEach((attachmentData: any) => {
		copyFile(attachmentData);
	});

	console.log('make zip');
	await makeZipFile(exportOperation);

	console.log('upload zip', exportOperation);
	const fileId = uploadZipFile(exportOperation.generatedFile, user._id, exportType);

	console.log('send email');
	sendEmail(user._id, fileId);
};

export async function channelExport(data: ExportInput, user: IUser): Promise<void> {
	if (data.type === 'email') {
		return sendViaEmail(data.data, user);
	}

	return sendFile(data.data, user);
}

Meteor.methods({ sendFile });
