import { Message, Omnichannel } from '@rocket.chat/core-services';
import {
	type IUser,
	type MessageTypesValues,
	type IOmnichannelSystemMessage,
	type ILivechatVisitor,
	isFileAttachment,
	isFileImageAttachment,
	type AtLeast,
} from '@rocket.chat/core-typings';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { Logger } from '@rocket.chat/logger';
import { LivechatRooms, Messages, Uploads, Users } from '@rocket.chat/models';
import { check } from 'meteor/check';
import moment from 'moment-timezone';

import { callbacks } from '../../../../lib/callbacks';
import { i18n } from '../../../../server/lib/i18n';
import { FileUpload } from '../../../file-upload/server';
import * as Mailer from '../../../mailer/server/api';
import { settings } from '../../../settings/server';
import { MessageTypes } from '../../../ui-utils/lib/MessageTypes';
import { getTimezone } from '../../../utils/server/lib/getTimezone';

const logger = new Logger('Livechat-SendTranscript');

export async function sendTranscript({
	token,
	rid,
	email,
	subject,
	user,
}: {
	token: string;
	rid: string;
	email: string;
	subject?: string;
	user?: Pick<IUser, '_id' | 'name' | 'username' | 'utcOffset'> | null;
}): Promise<boolean> {
	check(rid, String);
	check(email, String);
	logger.debug(`Sending conversation transcript of room ${rid} to user with token ${token}`);

	const room = await LivechatRooms.findOneById(rid);

	const visitor = room?.v as ILivechatVisitor;
	if (token !== visitor?.token) {
		throw new Error('error-invalid-visitor');
	}

	const userLanguage = settings.get<string>('Language') || 'en';
	const timezone = getTimezone(user);
	logger.debug(`Transcript will be sent using ${timezone} as timezone`);

	if (!room) {
		throw new Error('error-invalid-room');
	}

	// allow to only user to send transcripts from their own chats
	if (room.t !== 'l') {
		throw new Error('error-invalid-room');
	}

	const showAgentInfo = settings.get<boolean>('Livechat_show_agent_info');
	const showSystemMessages = settings.get<boolean>('Livechat_transcript_show_system_messages');
	const closingMessage = await Messages.findLivechatClosingMessage(rid, { projection: { ts: 1 } });
	const ignoredMessageTypes: MessageTypesValues[] = [
		'livechat_navigation_history',
		'livechat_transcript_history',
		'command',
		'livechat-close',
		'livechat-started',
		'livechat_video_call',
		'omnichannel_priority_change_history',
	];
	const acceptableImageMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
	const messages = await Messages.findVisibleByRoomIdNotContainingTypesBeforeTs(
		rid,
		ignoredMessageTypes,
		closingMessage?.ts ? new Date(closingMessage.ts) : new Date(),
		showSystemMessages,
		{
			sort: { ts: 1 },
		},
	);

	let html = '<div> <hr>';
	const InvalidFileMessage = `<div style="background-color: ${colors.n100}; text-align: center; border-color: ${
		colors.n250
	}; border-width: 1px; border-style: solid; border-radius: 4px; padding-top: 8px; padding-bottom: 8px; margin-top: 4px;">${i18n.t(
		'This_attachment_is_not_supported',
		{ lng: userLanguage },
	)}</div>`;

	for await (const message of messages) {
		let author;
		if (message.u._id === visitor._id) {
			author = i18n.t('You', { lng: userLanguage });
		} else {
			author = showAgentInfo ? message.u.name || message.u.username : i18n.t('Agent', { lng: userLanguage });
		}

		const isSystemMessage = MessageTypes.isSystemMessage(message);
		const messageType = isSystemMessage && MessageTypes.getType(message);

		let messageContent = messageType
			? `<i>${i18n.t(
					messageType.message,
					messageType.data
						? { ...messageType.data(message), interpolation: { escapeValue: false } }
						: { interpolation: { escapeValue: false } },
				)}</i>`
			: message.msg;

		let filesHTML = '';

		if (message.attachments && message.attachments?.length > 0) {
			messageContent = message.attachments[0].description || '';

			for await (const attachment of message.attachments) {
				if (!isFileAttachment(attachment)) {
					// ignore other types of attachments
					continue;
				}

				if (!isFileImageAttachment(attachment)) {
					filesHTML += `<div>${attachment.title || ''}${InvalidFileMessage}</div>`;
					continue;
				}

				if (!attachment.image_type || !acceptableImageMimeTypes.includes(attachment.image_type)) {
					filesHTML += `<div>${attachment.title || ''}${InvalidFileMessage}</div>`;
					continue;
				}

				// Image attachment can be rendered in email body
				const file = message.files?.find((file) => file.name === attachment.title);

				if (!file) {
					filesHTML += `<div>${attachment.title || ''}${InvalidFileMessage}</div>`;
					continue;
				}

				const uploadedFile = await Uploads.findOneById(file._id);

				if (!uploadedFile) {
					filesHTML += `<div>${file.name}${InvalidFileMessage}</div>`;
					continue;
				}

				const uploadedFileBuffer = await FileUpload.getBuffer(uploadedFile);
				filesHTML += `<div styles="color: ${colors.n700}; margin-top: 4px; flex-direction: "column";"><p>${file.name}</p><img src="data:${
					attachment.image_type
				};base64,${uploadedFileBuffer.toString(
					'base64',
				)}" style="width: 400px; max-height: 240px; object-fit: contain; object-position: 0;"/></div>`;
			}
		}

		const datetime = moment.tz(message.ts, timezone).locale(userLanguage).format('LLL');
		const singleMessage = `
			<p><strong>${author}</strong>  <em>${datetime}</em></p>
			<p>${messageContent}</p>
			<p>${filesHTML}</p>
		`;
		html += singleMessage;
	}

	html = `${html}</div>`;

	const fromEmail = settings.get<string>('From_Email').match(/\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}\b/i);
	let emailFromRegexp = '';
	if (fromEmail) {
		emailFromRegexp = fromEmail[0];
	} else {
		emailFromRegexp = settings.get<string>('From_Email');
	}

	// Some endpoints allow the caller to pass a different `subject` via parameter.
	// IF subject is passed, we'll use that one and treat it as an override
	// IF no subject is passed, we fallback to the setting `Livechat_transcript_email_subject`
	// IF that is not configured, we fallback to 'Transcript of your livechat conversation', which is the default value
	// As subject and setting value are user input, we don't translate them
	const mailSubject =
		subject ||
		settings.get<string>('Livechat_transcript_email_subject') ||
		i18n.t('Transcript_of_your_livechat_conversation', { lng: userLanguage });

	await Mailer.send({
		to: email,
		from: emailFromRegexp,
		replyTo: emailFromRegexp,
		subject: mailSubject,
		html,
	});

	setImmediate(() => {
		void callbacks.run('livechat.sendTranscript', messages, email);
	});

	const requestData: IOmnichannelSystemMessage['requestData'] = {
		type: 'user',
		visitor,
		user,
	};

	if (!user?.username) {
		const cat = await Users.findOneById('rocket.cat', { projection: { _id: 1, username: 1, name: 1 } });
		if (cat) {
			requestData.user = cat;
			requestData.type = 'visitor';
		}
	}

	if (!requestData.user) {
		logger.error('rocket.cat user not found');
		throw new Error('No user provided and rocket.cat not found');
	}

	await Message.saveSystemMessage<IOmnichannelSystemMessage>('livechat_transcript_history', room._id, '', requestData.user, {
		requestData,
	});

	return true;
}

export async function requestTranscript({
	rid,
	email,
	subject,
	user,
}: {
	rid: string;
	email: string;
	subject: string;
	user: AtLeast<IUser, '_id' | 'username' | 'utcOffset' | 'name'>;
}) {
	const room = await LivechatRooms.findOneById(rid, { projection: { _id: 1, open: 1, transcriptRequest: 1 } });

	if (!room?.open) {
		throw new Meteor.Error('error-invalid-room', 'Invalid room');
	}

	if (room.transcriptRequest) {
		throw new Meteor.Error('error-transcript-already-requested', 'Transcript already requested');
	}

	if (!(await Omnichannel.isWithinMACLimit(room))) {
		throw new Error('error-mac-limit-reached');
	}

	const { _id, username, name, utcOffset } = user;
	const transcriptRequest = {
		requestedAt: new Date(),
		requestedBy: {
			_id,
			username,
			name,
			utcOffset,
		},
		email,
		subject,
	};

	await LivechatRooms.setEmailTranscriptRequestedByRoomId(rid, transcriptRequest);
	return true;
}
