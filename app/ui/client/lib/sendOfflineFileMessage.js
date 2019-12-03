import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { TimeSync } from 'meteor/mizzao:timesync';
import toastr from 'toastr';

import { ChatMessage, CachedChatMessage } from '../../../models';
import { settings } from '../../../settings';
import { callbacks } from '../../../callbacks';
import { promises } from '../../../promises/client';
import { t, SWCache } from '../../../utils/client';

const getUrl = ({ _id, name }) => `/file-upload/${ _id }/${ name }`;

const getOfflineMessage = (roomId, msgData, file, meta) => {
	const id = file._id || Random.id();
	const name = file.name || meta.name;
	const type = file.type || meta.type;
	const fileUrl = getUrl({ _id: id, name });
	const size = file.size || meta.size;
	const attachment = {
		title: name,
		type: 'file',
		temp: true,
		description: file.description || meta.description,
		title_link: fileUrl,
		title_link_download: true,
	};

	if (/^image\/.+/.test(type)) {
		attachment.image_url = fileUrl;
		attachment.image_type = type;
		attachment.image_size = size;
		if (file.identify && file.identify.size) {
			attachment.image_dimensions = file.identify.size;
		}
	} else if (/^audio\/.+/.test(file.type)) {
		attachment.audio_url = fileUrl;
		attachment.audio_type = type;
		attachment.audio_size = size;
	} else if (/^video\/.+/.test(file.type)) {
		attachment.video_url = fileUrl;
		attachment.video_type = type;
		attachment.video_size = size;
	}

	return Object.assign({
		_id: msgData.id,
		rid: roomId,
		ts: new Date(),
		msg: '',
		file: {
			_id: id,
			name,
			type,
		},
		uploads: {
			id,
			name,
			percentage: 0,
		},
		meta,
		groupable: false,
		attachments: [attachment],
	}, msgData);
};

export const sendOfflineFileMessage = (roomId, msgData, file, meta, callback) => {
	if (!Meteor.userId()) {
		return false;
	}
	let message = getOfflineMessage(roomId, msgData, file, meta);
	const messageAlreadyExists = message._id && ChatMessage.findOne({ _id: message._id });

	if (messageAlreadyExists) {
		return toastr.error(t('Message_Already_Sent'));
	}

	const user = Meteor.user();
	message.ts = isNaN(TimeSync.serverOffset()) ? new Date() : new Date(Date.now() + TimeSync.serverOffset());
	message.u = {
		_id: Meteor.userId(),
		username: user.username,
	};

	if (settings.get('UI_Use_Real_Name')) {
		message.u.name = user.name;
	}

	message.temp = true;
	message.tempActions = { send: true };
	if (settings.get('Message_Read_Receipt_Enabled')) {
		message.unread = true;
	}

	SWCache.uploadToCache(message, file, (error) => {
		if (error) { return; }

		callback(message.file);
		message = callbacks.run('beforeSaveMessage', message);
		promises.run('onClientMessageReceived', message).then(function(message) {
			ChatMessage.insert(message);
			CachedChatMessage.save();
			return callbacks.run('afterSaveMessage', message);
		});
	});
};
