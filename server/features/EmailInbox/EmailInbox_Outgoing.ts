/* eslint-disable @typescript-eslint/camelcase */
import Mail from 'nodemailer/lib/mailer';
import { Match } from 'meteor/check';

import { callbacks } from '../../../app/callbacks/server';
import Messages from '../../../app/models/server/models/Messages';
import { IEmailInbox } from '../../../definition/IEmailInbox';
import { IUser } from '../../../definition/IUser';
import { FileUpload } from '../../../app/file-upload/server';
import { slashCommands } from '../../../app/utils/server';
import Rooms from '../../../app/models/server/models/Rooms';
import Uploads from '../../../app/models/server/models/Uploads';
import { Inbox, inboxes } from './EmailInbox';

const livechatQuoteRegExp = /^\[\s\]\(https?:\/\/.+\/live\/.+\?msg=(?<id>.+?)\)\s(?<text>.+)/s;

function sendEmail(inbox: Inbox, mail: Mail.Options): void {
	inbox.smtp.sendMail({
		from: inbox.config.senderInfo ? {
			name: inbox.config.senderInfo,
			address: inbox.config.email,
		} : inbox.config.email,
		...mail,
	}).then((info) => {
		console.log('Message sent: %s', info.messageId);
	});
}

slashCommands.add('sendEmailAttachment', (command: any, params: string) => {
	if (command !== 'sendEmailAttachment' || !Match.test(params, String)) {
		return;
	}

	const message = Messages.findOneById(params.trim());

	if (!message || !message.file) {
		return;
	}

	const room = Rooms.findOneById(message.rid);

	const inbox = inboxes.get(room.email.inbox);

	if (!inbox) {
		return;
	}

	const file = Uploads.findOneById(message.file._id);

	FileUpload.getBuffer(file, (_err?: Error, buffer?: Buffer) => {
		sendEmail(inbox, {
			to: room.email.replyTo,
			subject: room.email.subject,
			text: message.attachments[0].description || '',
			attachments: [{
				content: buffer,
				contentType: file.type,
				filename: file.name,
			}],
			inReplyTo: room.email.thread,
			references: [
				room.email.thread,
			],
		});
	});
}, {
	description: 'Send attachment as email',
	params: 'msg_id',
});

callbacks.add('beforeSaveMessage', function(message: any, room: any) {
	if (!room?.email?.inbox) {
		return message;
	}

	if (message.file) {
		message.attachments.push({
			actions: [{
				type: 'button',
				text: 'Send via Email as attachment',
				msg: `/sendEmailAttachment ${ message._id }`,
				msg_in_chat_window: true,
				msg_processing_type: 'sendMessage',
			}],
		});
	}

	return message;
}, callbacks.priority.LOW, 'ReplyEmail');

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

	sendEmail(inbox, {
		text: match.groups.text,
		inReplyTo: replyToMessage.email.messageId,
		references: [
			...replyToMessage.email.references ?? [],
			replyToMessage.email.messageId,
		],
		to: room.email.replyTo,
		subject: room.email.subject,
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

	sendEmail(inbox, {
		to: address,
		subject: 'Test of inbox configuration',
		text: 'Test of inbox configuration successful',
	});
}
