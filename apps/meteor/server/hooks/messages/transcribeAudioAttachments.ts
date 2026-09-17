import { Transcription } from '@rocket.chat/core-services';
import {
	isE2EEMessage,
	isFileAudioAttachment,
	type AudioAttachmentProps,
	type FileAttachmentProps,
	type IMessage,
	type IRoom,
	type IUser,
	type MessageAttachment,
} from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../lib/callbacks';
import { SystemLogger } from '../../lib/logger/system';
import { settings } from '../../settings';

const CALLBACK_ID = 'voice-transcription';

const isAudioAttachment = (attachment: MessageAttachment): attachment is AudioAttachmentProps & { type: 'file' } =>
	isFileAudioAttachment(attachment as FileAttachmentProps);

const transcribeAudioAttachments = (message: IMessage, { room, user }: { room: IRoom; user?: Pick<IUser, 'language'> }): IMessage => {
	// `sendFileMessage` stamps `transcription: { status: 'pending' }` from this same setting, so it has to be
	// read here too: gating the callback registration instead would let a message be stamped while no consumer
	// is registered yet, leaving the attachment pending forever.
	if (!settings.get<boolean>('AI_Voice_Transcription_Enabled')) {
		return message;
	}

	if (room.encrypted || isE2EEMessage(message) || !message.attachments?.length) {
		return message;
	}

	const languageHint = settings.get<string>('AI_Voice_Transcription_Language') || user?.language;

	message.attachments.forEach((attachment, attachmentIndex) => {
		if (!isAudioAttachment(attachment) || attachment.transcription?.status !== 'pending' || !attachment.fileId) {
			return;
		}

		Transcription.transcribeMessageAttachment({
			mid: message._id,
			rid: message.rid,
			attachmentIndex,
			fileId: attachment.fileId,
			...(languageHint ? { languageHint } : {}),
		}).catch((err) => {
			SystemLogger.error({ msg: 'Failed to enqueue audio attachment transcription', err, mid: message._id, fileId: attachment.fileId });
		});
	});

	return message;
};

Meteor.startup(() => {
	callbacks.add('afterSaveMessage', transcribeAudioAttachments, callbacks.priority.LOW, CALLBACK_ID);
});

export { transcribeAudioAttachments };
