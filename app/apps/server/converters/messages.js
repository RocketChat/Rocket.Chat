import { omit } from 'underscore';
import { Random } from 'meteor/random';
import { Messages, Rooms, Users } from '../../../models';

function getUnmappedProperties(source, ...mappedFields) {
	return mappedFields.reduce((result, map) => omit(result, (value, key) => map.hasOwnProperty(key)), source);
}

export class AppMessagesConverter {
	constructor(orch) {
		this.orch = orch;
	}

	convertById(msgId) {
		const msg = Messages.findOneById(msgId);

		return this.convertMessage(msg);
	}

	convertMessage(msgObj) {
		if (!msgObj) {
			return undefined;
		}

		const room = this.orch.getConverters().get('rooms').convertById(msgObj.rid);

		let sender;
		if (msgObj.u && msgObj.u._id) {
			sender = this.orch.getConverters().get('users').convertById(msgObj.u._id);

			if (!sender) {
				sender = this.orch.getConverters().get('users').convertToApp(msgObj.u);
			}
		}

		let editor;
		if (msgObj.editedBy) {
			editor = this.orch.getConverters().get('users').convertById(msgObj.editedBy._id);
		}

		const attachments = this._convertAttachmentsToApp(msgObj.attachments);

		const appMessage = {
			id: msgObj._id,
			room,
			sender,
			text: msgObj.msg,
			createdAt: msgObj.ts,
			updatedAt: msgObj._updatedAt,
			editor,
			editedAt: msgObj.editedAt,
			emoji: msgObj.emoji,
			avatarUrl: msgObj.avatar,
			alias: msgObj.alias,
			customFields: msgObj.customFields,
			groupable: msgObj.groupable,
			attachments,
			reactions: msgObj.reactions,
			parseUrls: msgObj.parseUrls,
		};

		appMessage._unmappedProperties_ = getUnmappedProperties(msgObj, appMessage, {
			_id: 1,
			msg: 1,
			ts: 1,
			_updatedAt: 1,
			avatar: 1,
			rid: 1,
			u: 1,
			editedBy: 1,
			mentions: 1,
			channels: 1,
		});

		return appMessage;
	}

	convertAppMessage(message) {
		if (!message) {
			return undefined;
		}

		const room = Rooms.findOneById(message.room.id);

		if (!room) {
			throw new Error('Invalid room provided on the message.');
		}

		let u;
		if (message.sender && message.sender.id) {
			const user = Users.findOneById(message.sender.id);

			if (user) {
				u = {
					_id: user._id,
					username: user.username,
					name: user.name,
				};
			} else {
				u = {
					_id: message.sender.id,
					username: message.sender.username,
					name: message.sender.name,
				};
			}
		}

		let editedBy;
		if (message.editor) {
			const editor = Users.findOneById(message.editor.id);
			editedBy = {
				_id: editor._id,
				username: editor.username,
			};
		}

		const attachments = this._convertAppAttachments(message.attachments);

		const newMessage = {
			_id: message.id || Random.id(),
			rid: room._id,
			u,
			msg: message.text,
			ts: message.createdAt || new Date(),
			_updatedAt: message.updatedAt || new Date(),
			editedBy,
			editedAt: message.editedAt,
			emoji: message.emoji,
			avatar: message.avatarUrl,
			alias: message.alias,
			customFields: message.customFields,
			groupable: message.groupable,
			attachments,
			reactions: message.reactions,
			parseUrls: message.parseUrls,
		};

		return Object.assign(newMessage, message._unmappedProperties_);
	}

	_convertAppAttachments(attachments) {
		if (typeof attachments === 'undefined' || !Array.isArray(attachments)) {
			return undefined;
		}

		return attachments.map((attachment) => Object.assign({
			collapsed: attachment.collapsed,
			color: attachment.color,
			text: attachment.text,
			ts: attachment.timestamp ? attachment.timestamp.toJSON() : attachment.timestamp,
			message_link: attachment.timestampLink,
			thumb_url: attachment.thumbnailUrl,
			author_name: attachment.author ? attachment.author.name : undefined,
			author_link: attachment.author ? attachment.author.link : undefined,
			author_icon: attachment.author ? attachment.author.icon : undefined,
			title: attachment.title ? attachment.title.value : undefined,
			title_link: attachment.title ? attachment.title.link : undefined,
			title_link_download: attachment.title ? attachment.title.displayDownloadLink : undefined,
			image_dimensions: attachment.imageDimensions,
			image_preview: attachment.imagePreview,
			image_url: attachment.imageUrl,
			image_type: attachment.imageType,
			image_size: attachment.imageSize,
			audio_url: attachment.audioUrl,
			audio_type: attachment.audioType,
			audio_size: attachment.audioSize,
			video_url: attachment.videoUrl,
			video_type: attachment.videoType,
			video_size: attachment.videoSize,
			fields: attachment.fields,
			button_alignment: attachment.actionButtonsAlignment,
			actions: attachment.actions,
			type: attachment.type,
			description: attachment.description,
		}, attachment._unmappedProperties_));
	}

	_convertAttachmentsToApp(attachments) {
		if (typeof attachments === 'undefined' || !Array.isArray(attachments)) {
			return undefined;
		}

		return attachments.map((attachment) => {
			let author;
			if (attachment.author_name || attachment.author_link || attachment.author_icon) {
				author = {
					name: attachment.author_name,
					link: attachment.author_link,
					icon: attachment.author_icon,
				};
			}

			let title;
			if (attachment.title || attachment.title_link || attachment.title_link_download) {
				title = {
					value: attachment.title,
					link: attachment.title_link,
					displayDownloadLink: attachment.title_link_download,
				};
			}

			const appAttachment = {
				collapsed: attachment.collapsed,
				color: attachment.color,
				text: attachment.text,
				timestamp: new Date(attachment.ts),
				timestampLink: attachment.message_link,
				thumbnailUrl: attachment.thumb_url,
				author,
				title,
				imageDimensions: attachment.image_dimensions,
				imagePreview: attachment.image_preview,
				imageUrl: attachment.image_url,
				imageType: attachment.image_type,
				imageSize: attachment.image_size,
				audioUrl: attachment.audio_url,
				audioType: attachment.audio_type,
				audioSize: attachment.audio_size,
				videoUrl: attachment.video_url,
				videoType: attachment.video_type,
				videoSize: attachment.video_size,
				fields: attachment.fields,
				actionButtonsAlignment: attachment.button_alignment,
				actions: attachment.actions,
				type: attachment.type,
				description: attachment.description,
			};

			appAttachment._unmappedProperties_ = getUnmappedProperties(attachment, appAttachment, {
				author_name: 1,
				author_link: 1,
				author_icon: 1,
				title_link: 1,
				title_link_download: 1,
				button_alignment: 1,
				ts: 1,
				message_link: 1,
				thumb_url : 1,
				image_dimensions: 1,
				image_preview: 1,
				image_url: 1,
				image_type: 1,
				image_size: 1,
				audio_url: 1,
				audio_type: 1,
				audio_size: 1,
				video_url: 1,
				video_type: 1,
				video_size: 1,
			});

			return appAttachment;
		});
	}
}
