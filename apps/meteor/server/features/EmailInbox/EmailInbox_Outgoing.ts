import { isIMessageInbox } from '@rocket.chat/core-typings';
import type { IEmailInbox, IUser, IOmnichannelRoom, SlashCommandCallbackParams } from '@rocket.chat/core-typings';
import { Messages, Uploads, LivechatRooms, Rooms, Users } from '@rocket.chat/models';
import { Match } from 'meteor/check';
import type Mail from 'nodemailer/lib/mailer';

import { FileUpload } from '../../../app/file-upload/server';
import { sendMessage } from '../../../app/lib/server/functions/sendMessage';
import { notifyOnMessageChange } from '../../../app/lib/server/lib/notifyListener';
import { settings } from '../../../app/settings/server';
import { slashCommands } from '../../../app/utils/server/slashCommand';
import { callbacks } from '../../../lib/callbacks';
import { i18n } from '../../lib/i18n';
import { inboxes } from './EmailInbox';
import type { Inbox } from './EmailInbox';
import { logger } from './logger';

const livechatQuoteRegExp = /^\[\s\]\(https?:\/\/.+\/live\/.+\?msg=(?<id>.+?)\)\s(?<text>.+)/s;

const getRocketCatUser = async (): Promise<IUser | null> => Users.findOneById('rocket.cat');

const language = settings.get<string>('Language') || 'en';
const t = (s: string): string => i18n.t(s, { lng: language });

// TODO: change these messages with room notifications
const sendErrorReplyMessage = async (error: string, options: any) => {
	if (!options?.rid || !options?.msgId) {
		return;
	}

	const message = {
		groupable: false,
		msg: `@${options.sender} something went wrong when replying email, sorry. **Error:**: ${error}`,
		_id: String(Date.now()),
		rid: options.rid,
		ts: new Date(),
	};

	const user = await getRocketCatUser();
	if (!user) {
		return;
	}

	return sendMessage(user, message, { _id: options.rid });
};

const sendSuccessReplyMessage = async (options: { room: IOmnichannelRoom; msgId: string; sender: string }) => {
	if (!options?.room?._id || !options?.msgId) {
		return;
	}
	const message = {
		groupable: false,
		msg: `@${options.sender} Attachment was sent successfully`,
		_id: String(Date.now()),
		rid: options.room._id,
		ts: new Date(),
	};

	const user = await getRocketCatUser();
	if (!user) {
		return;
	}

	return sendMessage(user, message, options.room);
};

async function sendEmail(inbox: Inbox, mail: Mail.Options, options?: any): Promise<{ messageId: string }> {
	return inbox.smtp
		.sendMail({
			from: inbox.config.senderInfo
				? {
						name: inbox.config.senderInfo,
						address: inbox.config.email,
				  }
				: inbox.config.email,
			...mail,
		})
		.then((info) => {
			logger.info({ msg: 'Message sent', info });
			return info;
		})
		.catch(async (err) => {
			logger.error({ msg: 'Error sending Email reply', err });

			if (!options?.msgId) {
				return;
			}

			await sendErrorReplyMessage(err.message, options);
		});
}

slashCommands.add({
	command: 'sendEmailAttachment',
	callback: async ({ command, params }: SlashCommandCallbackParams<'sendEmailAttachment'>) => {
		if (command !== 'sendEmailAttachment' || !Match.test(params, String)) {
			return;
		}

		const message = await Messages.findOneById(params.trim());
		if (!message?.file) {
			return;
		}

		const room = await Rooms.findOneById<IOmnichannelRoom>(message.rid);

		if (!room?.email) {
			return;
		}

		const inbox = inboxes.get(room.email.inbox);

		if (!inbox) {
			return sendErrorReplyMessage(`Email inbox ${room.email.inbox} not found or disabled.`, {
				msgId: message._id,
				sender: message.u.username,
				rid: room._id,
			});
		}

		const file = await Uploads.findOneById(message.file._id);

		if (!file) {
			return;
		}

		const buffer = await FileUpload.getBuffer(file);
		if (buffer) {
			void sendEmail(
				inbox,
				{
					to: room.email?.replyTo,
					subject: room.email?.subject,
					text: message?.attachments?.[0].description || '',
					attachments: [
						{
							content: buffer,
							contentType: file.type,
							filename: file.name,
						},
					],
					inReplyTo: Array.isArray(room.email?.thread) ? room.email?.thread[0] : room.email?.thread,
					references: ([] as string[]).concat(room.email?.thread || []),
				},
				{
					msgId: message._id,
					sender: message.u.username,
					rid: message.rid,
				},
			).then((info) => LivechatRooms.updateEmailThreadByRoomId(room._id, info.messageId));
		}

		await Messages.updateOne(
			{ _id: message._id },
			{
				$set: {
					blocks: [
						{
							type: 'context',
							elements: [
								{
									type: 'mrkdwn',
									text: `**${t('To')}:** ${room.email.replyTo}\n**${t('Subject')}:** ${room.email.subject}`,
								},
							],
						},
					],
				},
				$pull: {
					attachments: { 'actions.0.type': 'button' },
				},
			},
		);
		void notifyOnMessageChange({
			id: message._id,
		});

		return sendSuccessReplyMessage({
			msgId: message._id,
			sender: message.u.username,
			room,
		});
	},
	options: {
		description: 'Send attachment as email',
		params: 'msg_id',
	},
	providesPreview: false,
});

callbacks.add(
	'afterSaveMessage',
	async (message, { room: omnichannelRoom }) => {
		const room = omnichannelRoom as IOmnichannelRoom;

		if (!room?.email?.inbox) {
			return message;
		}

		const user = await getRocketCatUser();
		if (!user) {
			return message;
		}

		if (message.files?.length && message.u.username !== 'rocket.cat') {
			await sendMessage(
				user,
				{
					msg: '',
					attachments: [
						{
							actions: [
								{
									type: 'button',
									text: t('Send_via_Email_as_attachment'),
									msg: `/sendEmailAttachment ${message._id}`,
									msg_in_chat_window: true,
									msg_processing_type: 'sendMessage',
								},
							],
						},
					],
				},
				room,
				true,
			);
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
			await sendErrorReplyMessage(`Email inbox ${room.email.inbox} not found or disabled.`, {
				msgId: message._id,
				sender: message.u.username,
				rid: room._id,
			});

			return message;
		}

		if (!inbox) {
			return message;
		}

		const replyToMessage = await Messages.findOneById(match.groups.id);
		if (!replyToMessage || !isIMessageInbox(replyToMessage) || !replyToMessage.email?.messageId) {
			return message;
		}

		void sendEmail(
			inbox,
			{
				text: match.groups.text,
				inReplyTo: replyToMessage.email.messageId,
				references: [...(replyToMessage.email.references ?? []), replyToMessage.email.messageId],
				to: room.email.replyTo,
				subject: room.email.subject,
			},
			{
				msgId: message._id,
				sender: message.u.username,
				rid: room._id,
			},
		).then((info) => LivechatRooms.updateEmailThreadByRoomId(room._id, info.messageId));

		message.msg = match.groups.text;

		message.groupable = false;

		message.blocks = [
			{
				type: 'context',
				elements: [
					{
						type: 'mrkdwn',
						text: `**${t('To')}:** ${room.email.replyTo}\n**${t('Subject')}:** ${room.email.subject}`,
					},
				],
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: message.msg,
				},
			},
			{
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: `> ---\n${replyToMessage.msg.replace(/^/gm, '> ')}`,
				},
			},
		];

		delete message.urls;

		return message;
	},
	callbacks.priority.LOW,
	'ReplyEmail',
);

export async function sendTestEmailToInbox(emailInboxRecord: IEmailInbox, user: IUser): Promise<void> {
	const inbox = inboxes.get(emailInboxRecord.email);

	if (!inbox) {
		throw new Error('inbox-not-found');
	}

	const address = user.emails?.find((email) => email.verified)?.address;

	if (!address) {
		throw new Error('user-without-verified-email');
	}

	void sendEmail(inbox, {
		to: address,
		subject: 'Test of inbox configuration',
		text: 'Test of inbox configuration successful',
	});
}
