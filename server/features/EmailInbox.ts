/* eslint-disable @typescript-eslint/camelcase */
import stripHtml from 'string-strip-html';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { ParsedMail, Attachment } from 'mailparser';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

import { EmailInbox } from '../../app/models/server/raw';
import { IMAPInterceptor } from '../email/IMAPInterceptor';
import { Livechat } from '../../app/livechat/server/lib/Livechat';
import LivechatVisitors from '../../app/models/server/models/LivechatVisitors';
import LivechatRooms from '../../app/models/server/models/LivechatRooms';
import { callbacks } from '../../app/callbacks/server';
import Messages from '../../app/models/server/models/Messages';
import { IEmailInbox } from '../../definition/IEmailInbox';
import { IUser } from '../../definition/IUser';
import { FileUpload } from '../../app/file-upload/server';

type FileAttachment = {
	title: string;
	title_link: string;
	image_url?: string;
	image_type?: string;
	image_size?: string;
	image_dimensions?: string;
	audio_url?: string;
	audio_type?: string;
	audio_size?: string;
	video_url?: string;
	video_type?: string;
	video_size?: string;
}

const inboxes = new Map<string, {imap: IMAPInterceptor; smtp: Mail; config: IEmailInbox}>();

function getGuestByEmail(email: string, name: string, department?: string): any {
	const guest = LivechatVisitors.findOneGuestByEmailAddress(email);

	if (guest) {
		return guest;
	}

	const userId = Livechat.registerGuest({
		token: Random.id(),
		name: name || email,
		email,
		department,
		phone: undefined,
		username: undefined,
		connectionData: undefined,
	});

	const newGuest = LivechatVisitors.findOneById(userId, {});
	if (newGuest) {
		return newGuest;
	}

	throw new Error('Error getting guest');
}

async function uploadAttachment(attachment: Attachment, rid: string, visitorToken: string): Promise<FileAttachment> {
	const details = {
		name: attachment.filename,
		size: attachment.size,
		type: attachment.contentType,
		rid,
		visitorToken,
	};

	const fileStore = FileUpload.getStore('Uploads');
	return new Promise((resolve, reject) => {
		fileStore.insert(details, attachment.content, function(err: any, file: any) {
			if (err) {
				reject(new Error(err));
			}

			const url = FileUpload.getPath(`${ file._id }/${ encodeURI(file.name) }`);

			const attachment: FileAttachment = {
				title: file.name,
				title_link: url,
			};

			if (/^image\/.+/.test(file.type)) {
				attachment.image_url = url;
				attachment.image_type = file.type;
				attachment.image_size = file.size;
				attachment.image_dimensions = file.identify != null ? file.identify.size : undefined;
			}

			if (/^audio\/.+/.test(file.type)) {
				attachment.audio_url = url;
				attachment.audio_type = file.type;
				attachment.audio_size = file.size;
			}

			if (/^video\/.+/.test(file.type)) {
				attachment.video_url = url;
				attachment.video_type = file.type;
				attachment.video_size = file.size;
			}

			resolve(attachment);
		});
	});
}

async function onEmailReceived(email: ParsedMail, inbox: string, department?: string): Promise<void> {
	// console.log('NEW EMAIL =>', email);

	if (!email.from?.value?.[0]?.address) {
		return;
	}

	const references = typeof email.references === 'string' ? [email.references] : email.references;

	const thread = references?.[0] ?? email.messageId;

	const guest = getGuestByEmail(email.from.value[0].address, email.from.value[0].name, department);

	// TODO: Get the closed room and reopen rather than create a new one
	// const room = LivechatRooms.findOneByVisitorTokenAndEmailThread(guest.token, emailThread, {});
	const room = LivechatRooms.findOneOpenByVisitorTokenAndEmailThread(guest.token, thread, {});

	let msg = email.text;

	if (email.html) {
		// Try to remove the signature and history
		msg = stripHtml(email.html.replace(/<div name="messageSignatureSection.+/s, '')).result;
	}

	const rid = room?._id ?? Random.id();

	const attachments = [];
	for await (const attachment of email.attachments) {
		if (attachment.type !== 'attachment') {
			continue;
		}

		try {
			attachments.push(await uploadAttachment(attachment, rid, guest.token));
		} catch (e) {
			console.error('Error uploading attachment from email', e);
		}
	}

	Livechat.sendMessage({
		guest,
		message: {
			_id: Random.id(),
			groupable: false,
			msg,
			attachments,
			blocks: [{
				type: 'context',
				elements: [{
					type: 'mrkdwn',
					text: `**From:** ${ email.from.text }\n**Subject:** ${ email.subject }`,
				}],
			}, {
				type: 'section',
				text: {
					type: 'plain_text',
					text: msg,
				},
			}],
			rid,
			email: {
				references,
				messageId: email.messageId,
			},
		},
		roomInfo: {
			email: {
				inbox,
				thread,
				replyTo: email.from.value[0].address,
				subject: email.subject,
			},
		},
		agent: undefined,
	});
}

const livechatQuoteRegExp = /^\[\s\]\(https?:\/\/.+\/live\/.+\?msg=(?<id>.+?)\)\s(?<text>.+)/s;

callbacks.add('afterSaveMessage', function(message: any, room: any) {
	if (!room.email?.inbox || !message.urls || message.urls.length === 0) {
		return message;
	}

	const { msg } = message;

	// Try to identify a quote in a livechat room
	const match = msg.match(livechatQuoteRegExp);
	if (!match) {
		return message;
	}

	const inbox = inboxes.get(room.email.inbox);

	if (!inbox) {
		return message;
	}

	const replyToMessage = Messages.findOneById(match.groups.id);

	if (!replyToMessage) {
		return message;
	}

	inbox.smtp.sendMail({
		from: inbox.config.senderInfo ? {
			name: inbox.config.senderInfo,
			address: inbox.config.email,
		} : inbox.config.email,
		to: room.email.replyTo,
		subject: room.email.subject,
		text: match.groups.text,
		inReplyTo: replyToMessage.email.messageId,
		references: [
			...replyToMessage.email.references ?? [],
			replyToMessage.email.messageId,
		],
	}).then((info) => {
		console.log('Message sent: %s', info.messageId);
	});

	return message;
}, callbacks.priority.LOW, 'ReplyEmail');

export async function sendTestEmailToInbox(emailInboxRecord: IEmailInbox, user: IUser): Promise<void> {
	const inbox = inboxes.get(emailInboxRecord.email);

	if (!inbox) {
		throw new Error('inbox-not-found');
	}

	const address = user.emails?.find((email) => email.verified)?.address;

	if (!address) {
		throw new Error('user-without-verified-email');
	}

	console.log(`Sending testing email to ${ address }`);

	inbox.smtp.sendMail({
		from: inbox.config.senderInfo ? {
			name: inbox.config.senderInfo,
			address: inbox.config.email,
		} : inbox.config.email,
		to: address,
		subject: 'Test of inbox configuration',
		text: 'Test of inbox configuration successful',
	}).then((info) => {
		console.log('Message sent: %s', info.messageId);
	});
}

export async function configureEmailInboxes(): Promise<void> {
	const emailInboxesCursor = EmailInbox.find({
		active: true,
	});

	for (const { imap } of inboxes.values()) {
		imap.stop();
	}

	inboxes.clear();

	for await (const emailInboxRecord of emailInboxesCursor) {
		console.log('Setting up email interceptor for', emailInboxRecord.email);

		// TODO: Get attachments
		const imap = new IMAPInterceptor({
			password: emailInboxRecord.imap.password,
			user: emailInboxRecord.imap.username,
			host: emailInboxRecord.imap.server,
			port: parseInt(emailInboxRecord.imap.port),
			tls: emailInboxRecord.imap.sslTls,
			tlsOptions: {
				rejectUnauthorized: false,
			},
			// debug: (...args: any[]): void => console.log(...args),
		}, {
			deleteAfterRead: false,
			filter: [['UNSEEN'], ['SINCE', emailInboxRecord._updatedAt]],
			rejectBeforeTS: emailInboxRecord._updatedAt,
			markSeen: true,
		});

		imap.on('email', Meteor.bindEnvironment((email) => onEmailReceived(email, emailInboxRecord.email, emailInboxRecord.department)));

		imap.start();

		const smtp = nodemailer.createTransport({
			host: emailInboxRecord.smtp.server,
			port: parseInt(emailInboxRecord.smtp.port),
			secure: emailInboxRecord.smtp.sslTls,
			auth: {
				user: emailInboxRecord.smtp.username,
				pass: emailInboxRecord.smtp.password,
			},
		});

		inboxes.set(emailInboxRecord.email, { imap, smtp, config: emailInboxRecord });
	}
}

configureEmailInboxes();
