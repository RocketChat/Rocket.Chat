/* eslint-disable @typescript-eslint/camelcase */
import Mail from 'nodemailer/lib/mailer';
import { Match } from 'meteor/check';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { callbacks } from '../../../app/callbacks/server';
import { IEmailInbox } from '../../../definition/IEmailInbox';
import { IUser } from '../../../definition/IUser';
import { FileUpload } from '../../../app/file-upload/server';
import { slashCommands } from '../../../app/utils/server';
import { Messages, Rooms, Uploads, Users } from '../../../app/models/server';
import { Inbox, inboxes } from './EmailInbox';
import { sendMessage } from '../../../app/lib/server/functions/sendMessage';
import { settings } from '../../../app/settings/server';
import { IMessage } from '../../../definition/IMessage';


const livechatQuoteRegExp = /^\[\s\]\(https?:\/\/.+\/live\/.+\?msg=(?<id>.+?)\)\s(?<text>.+)/s;

const user: IUser = Users.findOneById('rocket.cat');

const language = settings.get('Language') || 'en';
const t = (s: string): string => TAPi18n.__(s, { lng: language });

const sendErrorReplyMessage = (error: string, options: any): void => {
	if (!options?.rid || !options?.msgId) {
		return;
	}

	const message = {
		groupable: false,
		msg: `@${ options.sender } something went wrong when replying email, sorry. **Error:**: ${ error }`,
		_id: String(Date.now()),
		rid: options.rid,
		ts: new Date(),
	};

	sendMessage(user, message, { _id: options.rid });
};

function sendEmail(inbox: Inbox, mail: Mail.Options, options?: any): void {
	inbox.smtp.sendMail({
		from: inbox.config.senderInfo ? {
			name: inbox.config.senderInfo,
			address: inbox.config.email,
		} : inbox.config.email,
		...mail,
	}).then((info) => {
		console.log('Message sent: %s', info.messageId);
	}).catch((error) => {
		console.log('Error sending Email reply: %s', error.message);

		if (!options?.msgId) {
			return;
		}

		sendErrorReplyMessage(error.message, options);
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
		return sendErrorReplyMessage(`Email inbox ${ room.email.inbox } not found or disabled.`, {
			msgId: message._id,
			sender: message.u.username,
			rid: room._id,
		});
	}

	const file = Uploads.findOneById(message.file._id);

	FileUpload.getBuffer(file, (_err?: Error, buffer?: Buffer) => {
		!_err && buffer && sendEmail(inbox, {
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
		},
		{
			msgId: message._id,
			sender: message.u.username,
			rid: message.rid,
		});
	});

	Messages.update({ _id: message._id }, {
		$set: {
			blocks: [{
				type: 'context',
				elements: [{
					type: 'mrkdwn',
					text: `**${ t('To') }:** ${ room.email.replyTo }\n**${ t('Subject') }:** ${ room.email.subject }`,
				}],
			}],
		},
		$pull: {
			attachments: { 'actions.0.type': 'button' },
		},
	});
}, {
	description: 'Send attachment as email',
	params: 'msg_id',
});

callbacks.add('beforeSaveMessage', function(message: IMessage, room: any) {
	if (!room?.email?.inbox) {
		return message;
	}

	if (message.file) {
		message.attachments.push({
			actions: [{
				type: 'button',
				text: t('Send_via_Email_as_attachment'),
				msg: `/sendEmailAttachment ${ message._id }`,
				msg_in_chat_window: true,
				msg_processing_type: 'sendMessage',
			}],
		});

		return message;
	}

	const { msg } = message;

	// Try to identify a quote in a livechat room
	const match = msg.match(livechatQuoteRegExp);
	if (!match?.groups) {
		return message;
	}

	const inbox = inboxes.get(room.email.inbox);

	if (!inbox) {
		sendErrorReplyMessage(`Email inbox ${ room.email.inbox } not found or disabled.`, {
			msgId: message._id,
			sender: message.u.username,
			rid: room._id,
		});

		return message;
	}

	if (!inbox) {
		return message;
	}

	const replyToMessage = Messages.findOneById(match.groups.id);

	if (!replyToMessage?.email?.messageId) {
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
	},
	{
		msgId: message._id,
		sender: message.u.username,
		rid: room._id,
	});

	message.msg = match.groups.text;

	message.groupable = false;

	message.blocks = [{
		type: 'context',
		elements: [{
			type: 'mrkdwn',
			text: `**${ t('To') }:** ${ room.email.replyTo }\n**${ t('Subject') }:** ${ room.email.subject }`,
		}],
	}, {
		type: 'section',
		text: {
			type: 'mrkdwn',
			text: message.msg,
		},
	}, {
		type: 'section',
		text: {
			type: 'mrkdwn',
			text: `> ---\n${ replyToMessage.msg.replace(/^/gm, '> ') }`,
		},
	}];

	delete message.urls;

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
