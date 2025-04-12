import type {
	ILivechatVisitor,
	IOmnichannelRoom,
	VideoAttachmentProps,
	ImageAttachmentProps,
	AudioAttachmentProps,
} from '@rocket.chat/core-typings';
import { OmnichannelSourceType } from '@rocket.chat/core-typings';
import { LivechatVisitors, LivechatRooms, Messages } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import type { ParsedMail, Attachment } from 'mailparser';
import { stripHtml } from 'string-strip-html';

import { logger } from './logger';
import { FileUpload } from '../../../app/file-upload/server';
import { notifyOnMessageChange } from '../../../app/lib/server/lib/notifyListener';
import { QueueManager } from '../../../app/livechat/server/lib/QueueManager';
import { setDepartmentForGuest } from '../../../app/livechat/server/lib/departmentsLib';
import { registerGuest } from '../../../app/livechat/server/lib/guests';
import { sendMessage } from '../../../app/livechat/server/lib/messages';
import { settings } from '../../../app/settings/server';
import { i18n } from '../../lib/i18n';

type FileAttachment = VideoAttachmentProps & ImageAttachmentProps & AudioAttachmentProps;

const language = settings.get<string>('Language') || 'en';
const t = i18n.getFixedT(language);

async function getGuestByEmail(email: string, name: string, department = ''): Promise<ILivechatVisitor | null> {
	const guest = await LivechatVisitors.findOneGuestByEmailAddress(email);

	if (guest) {
		if (guest.department !== department) {
			if (!department) {
				await LivechatVisitors.removeDepartmentById(guest._id);
				delete guest.department;
				return guest;
			}
			await setDepartmentForGuest({ token: guest.token, department });
			return LivechatVisitors.findOneEnabledById(guest._id, {});
		}
		return guest;
	}

	const livechatVisitor = await registerGuest({
		token: Random.id(),
		name: name || email,
		email,
		department,
	});

	if (!livechatVisitor) {
		throw new Error('Error getting guest');
	}

	return livechatVisitor;
}

async function uploadAttachment(attachmentParam: Attachment, rid: string, visitorToken: string): Promise<Partial<FileAttachment>> {
	const details = {
		name: attachmentParam.filename,
		size: attachmentParam.size,
		type: attachmentParam.contentType,
		rid,
		visitorToken,
	};

	const fileStore = FileUpload.getStore('Uploads');

	const file = await fileStore.insert(details, attachmentParam.content);

	const url = FileUpload.getPath(`${file._id}/${encodeURI(file.name || '')}`);

	const attachment: Partial<FileAttachment> = {
		title: file.name || '',
		title_link: url,
	};

	if (file.type && /^image\/.+/.test(file.type)) {
		attachment.image_url = url;
		attachment.image_type = file.type;
		attachment.image_size = file.size;
		attachment.image_dimensions = file.identify?.size != null ? file.identify.size : undefined;
	}

	if (file.type && /^audio\/.+/.test(file.type)) {
		attachment.audio_url = url;
		attachment.audio_type = file.type;
		attachment.audio_size = file.size;
	}

	if (file.type && /^video\/.+/.test(file.type)) {
		attachment.video_url = url;
		attachment.video_type = file.type;
		attachment.video_size = file.size;
	}

	return attachment;
}

export async function onEmailReceived(email: ParsedMail, inbox: string, department = ''): Promise<void> {
	logger.info(`New email conversation received on inbox ${inbox}. Will be assigned to department ${department}`);
	if (!email.from?.value?.[0]?.address) {
		return;
	}

	const references = typeof email.references === 'string' ? [email.references] : email.references;
	const initialRef = [email.messageId, email.inReplyTo].filter(Boolean) as string[];
	const thread = (references?.length ? references : []).flatMap((t: string) => t.split(',')).concat(initialRef);
	const guest = await getGuestByEmail(email.from.value[0].address, email.from.value[0].name, department);

	if (!guest) {
		logger.error(`No visitor found for ${email.from.value[0].address}`);
		return;
	}

	let room: IOmnichannelRoom | null = await LivechatRooms.findOneByVisitorTokenAndEmailThreadAndDepartment(
		guest.token,
		thread,
		department,
		{},
	);

	logger.debug({
		msg: 'Room found for guest',
		room,
		guest,
	});

	if (room?.closedAt) {
		room = await QueueManager.unarchiveRoom(room);
	}

	// TODO: html => md with turndown
	const msg = email.html
		? stripHtml(email.html, {
				dumpLinkHrefsNearby: {
					enabled: true,
					putOnNewLine: false,
					wrapHeads: '(',
					wrapTails: ')',
				},
				skipHtmlDecoding: false,
			}).result
		: email.text || '';

	const rid = room?._id ?? Random.id();
	const msgId = Random.id();

	sendMessage({
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
				} catch (err) {
					logger.error({ msg: 'Error uploading attachment from email', err });
				}
			}

			await Messages.updateOne(
				{ _id: msgId },
				{
					$addToSet: {
						attachments: {
							$each: attachments,
						},
					},
				},
			);
			room && (await LivechatRooms.updateEmailThreadByRoomId(room._id, thread));
			void notifyOnMessageChange({
				id: msgId,
			});
		})
		.catch((err) => {
			logger.error({
				msg: 'Error receiving email',
				err,
			});
		});
}
