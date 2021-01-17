import stripHtml from 'string-strip-html';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { ParsedMail } from 'mailparser';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

import { EmailInbox } from '../../app/models/server/raw';
import { IMAPInterceptor } from '../email/IMAPInterceptor';
import { Livechat } from '../../app/livechat/server';
import LivechatVisitors from '../../app/models/server/models/LivechatVisitors';
import LivechatRooms from '../../app/models/server/models/LivechatRooms';
import { callbacks } from '../../app/callbacks/server';
import Messages from '../../app/models/server/models/Messages';

const inboxes = new Map<string, {imap: IMAPInterceptor; smtp: Mail}>();

function getGuestByEmail(email: string, name: string): any {
	const guest = LivechatVisitors.findOneGuestByEmailAddress(email);

	if (guest) {
		return guest;
	}

	const userId = Livechat.registerGuest({
		token: Random.id(),
		name: name || email,
		email,
		department: undefined,
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

function onEmailReceived(email: ParsedMail, inbox: string): void {
	// console.log('NEW EMAIL =>', email.headers);

	if (!email.from?.value?.[0]?.address) {
		return;
	}

	const references = typeof email.references === 'string' ? [email.references] : email.references;

	const thread = references?.[0] ?? email.messageId;

	const guest = getGuestByEmail(email.from.value[0].address, email.from.value[0].name);

	// TODO: Get the closed room and reopen rather than create a new one
	// const room = LivechatRooms.findOneByVisitorTokenAndEmailThread(guest.token, emailThread, {});
	const room = LivechatRooms.findOneOpenByVisitorTokenAndEmailThread(guest.token, thread, {});

	let msg = email.text;

	if (email.html) {
		// Try to remove the signature and history
		msg = stripHtml(email.html.replace(/<div name="messageSignatureSection.+/s, '')).result;
	}

	const rid = room?._id ?? Random.id();

	Livechat.sendMessage({
		guest,
		message: {
			_id: Random.id(),
			groupable: false,
			msg,
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
			filter: [['UNSEEN'], ['SINCE', emailInboxRecord.ts]],
			rejectBeforeTS: emailInboxRecord.ts,
			markSeen: true,
		});

		imap.on('email', Meteor.bindEnvironment((email) => onEmailReceived(email, emailInboxRecord.email)));

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

		inboxes.set(emailInboxRecord.email, { imap, smtp });
	}
}

configureEmailInboxes();
