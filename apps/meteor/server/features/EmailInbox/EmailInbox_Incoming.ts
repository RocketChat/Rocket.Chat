import stripHtml from 'string-strip-html';
import { Random } from 'meteor/random';
import type { ParsedMail, Attachment } from 'mailparser';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import type { ILivechatVisitor, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { OmnichannelSourceType } from '@rocket.chat/core-typings';
import { LivechatVisitors } from '@rocket.chat/models';

import { Livechat } from '../../../app/livechat/server/lib/Livechat';
import { LivechatRooms, Messages } from '../../../app/models/server';
import { FileUpload } from '../../../app/file-upload/server';
import { QueueManager } from '../../../app/livechat/server/lib/QueueManager';
import { settings } from '../../../app/settings/server';
import { logger } from './logger';

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
};

const language = settings.get<string>('Language') || 'en';
const t = (s: string): string => TAPi18n.__(s, { lng: language });

async function getGuestByEmail(email: string, name: string, department = ''): Promise<ILivechatVisitor | null> {
	logger.debug(`Attempt to register a guest for ${email} on department: ${department}`);
	const guest = await LivechatVisitors.findOneGuestByEmailAddress(email);

	if (guest) {
		logger.debug(`Guest with email ${email} found with id ${guest._id}`);
		if (guest.department !== department) {
			logger.debug({
				msg: 'Switching departments for guest',
				guest,
				previousDepartment: guest.department,
				newDepartment: department,
			});
			if (!department) {
				await LivechatVisitors.removeDepartmentById(guest._id);
				delete guest.department;
				return guest;
			}
			await Livechat.setDepartmentForGuest({ token: guest.token, department });
			return LivechatVisitors.findOneById(guest._id, {});
		}
		return guest;
	}

	logger.debug({
		msg: 'Creating a new Omnichannel guest for visitor with email',
		email,
	});
	const userId = await Livechat.registerGuest({
		token: Random.id(),
		name: name || email,
		email,
		department,
		phone: undefined,
		username: undefined,
		connectionData: undefined,
		id: undefined,
	});

	const newGuest = await LivechatVisitors.findOneById(userId);
	logger.debug(`Guest ${userId} for visitor ${email} created`);
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
		fileStore.insert(details, attachment.content, function (err: any, file: any) {
			if (err) {
				reject(new Error(err));
			}

			const url = FileUpload.getPath(`${file._id}/${encodeURI(file.name)}`);

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

export async function onEmailReceived(email: ParsedMail, inbox: string, department = ''): Promise<void> {
	logger.debug(`New email conversation received on inbox ${inbox}. Will be assigned to department ${department}`, email);
	if (!email.from?.value?.[0]?.address) {
		return;
	}

	const references = typeof email.references === 'string' ? [email.references] : email.references;
	const initialRef = [email.messageId, email.inReplyTo].filter(Boolean) as string[];
	const thread = (references?.length ? references : []).flatMap((t: string) => t.split(',')).concat(initialRef);

	logger.debug(`Received new email conversation with thread ${thread} on inbox ${inbox} from ${email.from.value[0].address}`);

	logger.debug(`Fetching guest for visitor ${email.from.value[0].address}`);
	const guest = await getGuestByEmail(email.from.value[0].address, email.from.value[0].name, department);

	if (!guest) {
		logger.debug(`No visitor found for ${email.from.value[0].address}`);
		return;
	}

	logger.debug(`Guest ${guest._id} obtained. Attempting to find or create a room on department ${department}`);

	let room: IOmnichannelRoom = LivechatRooms.findOneByVisitorTokenAndEmailThreadAndDepartment(guest.token, thread, department, {});

	logger.debug({
		msg: 'Room found for guest',
		room,
		guest,
	});

	if (room?.closedAt) {
		logger.debug(`Room ${room?._id} is closed. Reopening`);
		room = await QueueManager.unarchiveRoom(room);
	}

	let msg = email.text;

	if (email.html) {
		// Try to remove the signature and history
		msg = stripHtml(email.html.replace(/<div name="messageSignatureSection.+/s, '')).result;
	}

	const rid = room?._id ?? Random.id();
	const msgId = Random.id();

	logger.debug(`Sending email message to room ${rid} for visitor ${guest._id}. Conversation assigned to department ${department}`);

	Livechat.sendMessage({
		guest,
		message: {
			_id: msgId,
			groupable: false,
			msg,
			token: guest.token,
			attachments: [
				{
					actions: [
						{
							type: 'button',
							text: t('Reply_via_Email'),
							msg: 'msg',
							msgId,
							msg_in_chat_window: true,
							msg_processing_type: 'respondWithQuotedMessage',
						},
					],
				},
			],
			blocks: [
				{
					type: 'context',
					elements: [
						{
							type: 'mrkdwn',
							text: `**${t('From')}:** ${email.from.text}\n**${t('Subject')}:** ${email.subject}`,
						},
					],
				},
				{
					type: 'section',
					text: {
						type: 'mrkdwn',
						text: msg,
					},
				},
			],
			rid,
			email: {
				thread,
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
			source: {
				type: OmnichannelSourceType.EMAIL,
				id: inbox,
				alias: 'email-inbox',
			},
		},
		agent: undefined,
	})
		.then(async () => {
			if (!email.attachments.length) {
				return;
			}

			const attachments = [];
			for await (const attachment of email.attachments) {
				if (attachment.type !== 'attachment') {
					continue;
				}

				try {
					attachments.push(await uploadAttachment(attachment, rid, guest.token));
				} catch (e) {
					Livechat.logger.error('Error uploading attachment from email', e);
				}
			}

			Messages.update(
				{ _id: msgId },
				{
					$addToSet: {
						attachments: {
							$each: attachments,
						},
					},
				},
			);
			LivechatRooms.updateEmailThreadByRoomId(room._id, thread);
		})
		.catch((err) => {
			Livechat.logger.error({
				msg: 'Error receiving email',
				err,
			});
		});
}
