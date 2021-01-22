/* eslint-disable @typescript-eslint/camelcase */
import stripHtml from 'string-strip-html';
import { Random } from 'meteor/random';
import { ParsedMail, Attachment } from 'mailparser';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { Livechat } from '../../../app/livechat/server/lib/Livechat';
import { LivechatRooms, LivechatVisitors, Messages } from '../../../app/models/server';
import { FileUpload } from '../../../app/file-upload/server';
import { QueueManager } from '../../../app/livechat/server/lib/QueueManager';
import { settings } from '../../../app/settings/server';

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

const language = settings.get('Language') || 'en';
const t = (s: string): string => TAPi18n.__(s, { lng: language });

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

export async function onEmailReceived(email: ParsedMail, inbox: string, department?: string): Promise<void> {
	if (!email.from?.value?.[0]?.address) {
		return;
	}

	const references = typeof email.references === 'string' ? [email.references] : email.references;

	const thread = references?.[0] ?? email.messageId;

	const guest = getGuestByEmail(email.from.value[0].address, email.from.value[0].name, department);

	let room = LivechatRooms.findOneByVisitorTokenAndEmailThread(guest.token, thread, {});
	if (room?.closedAt) {
		room = await QueueManager.unarchiveRoom(room);
	}

	let msg = email.text;

	if (email.html) {
		// Try to remove the signature and history
		msg = stripHtml(email.html.replace(/<div name="messageSignatureSection.+/s, '')).result;
	}

	const rid = room?._id ?? Random.id();
	const msgId = Random.id();

	Livechat.sendMessage({
		guest,
		message: {
			_id: msgId,
			groupable: false,
			msg,
			attachments: [
				{
					actions: [{
						type: 'button',
						text: t('Reply_via_Email'),
						msg: 'msg',
						msgId,
						msg_in_chat_window: true,
						msg_processing_type: 'respondWithQuotedMessage',
					}],
				},
			],
			blocks: [{
				type: 'context',
				elements: [{
					type: 'mrkdwn',
					text: `**${ t('From') }:** ${ email.from.text }\n**${ t('Subject') }:** ${ email.subject }`,
				}],
			}, {
				type: 'section',
				text: {
					type: 'mrkdwn',
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
	}).then(async () => {
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
				console.error('Error uploading attachment from email', e);
			}
		}

		Messages.update({ _id: msgId }, {
			$addToSet: {
				attachments: {
					$each: attachments,
				},
			},
		});
	}).catch((error) => {
		console.log('Error receiving Email: %s', error.message);
	});
}
