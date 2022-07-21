import { Random } from 'meteor/random';

import { Messages, Rooms, Users } from '../../../models/server';
import { transformMappedData } from '../../lib/misc/transformMappedData';

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

		const map = {
			id: '_id',
			threadId: 'tmid',
			reactions: 'reactions',
			parseUrls: 'parseUrls',
			text: 'msg',
			createdAt: 'ts',
			updatedAt: '_updatedAt',
			editedAt: 'editedAt',
			emoji: 'emoji',
			avatarUrl: 'avatar',
			alias: 'alias',
			file: 'file',
			customFields: 'customFields',
			groupable: 'groupable',
			token: 'token',
			blocks: 'blocks',
			room: (message) => {
				const result = this.orch.getConverters().get('rooms').convertById(message.rid);
				delete message.rid;
				return result;
			},
			editor: (message) => {
				const { editedBy } = message;
				delete message.editedBy;

				if (!editedBy) {
					return undefined;
				}

				return this.orch.getConverters().get('users').convertById(editedBy._id);
			},
			attachments: (message) => {
				const result = this._convertAttachmentsToApp(message.attachments);
				delete message.attachments;
				return result;
			},
			sender: (message) => {
				if (!message.u || !message.u._id) {
					return undefined;
				}

				let user = this.orch.getConverters().get('users').convertById(message.u._id);

				// When the sender of the message is a Guest (livechat) and not a user
				if (!user) {
					user = this.orch.getConverters().get('users').convertToApp(message.u);
				}

				delete message.u;

				return user;
			},
		};

		return transformMappedData(msgObj, map);
	}

	convertAppMessage(message) {
		if (!message || !message.room) {
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
			...('threadId' in message && { tmid: message.threadId }),
			rid: room._id,
			u,
			msg: message.text,
			ts: message.createdAt || new Date(),
			_updatedAt: message.updatedAt || new Date(),
			...(editedBy && { editedBy }),
			...('editedAt' in message && { editedAt: message.editedAt }),
			...('emoji' in message && { emoji: message.emoji }),
			...('avatarUrl' in message && { avatar: message.avatarUrl }),
			...('alias' in message && { alias: message.alias }),
			...('customFields' in message && { customFields: message.customFields }),
			...('groupable' in message && { groupable: message.groupable }),
			...(attachments && { attachments }),
			...('reactions' in message && { reactions: message.reactions }),
			...('parseUrls' in message && { parseUrls: message.parseUrls }),
			...('blocks' in message && { blocks: message.blocks }),
			...('token' in message && { token: message.token }),
		};

		return Object.assign(newMessage, message._unmappedProperties_);
	}

	_convertAppAttachments(attachments) {
		if (typeof attachments === 'undefined' || !Array.isArray(attachments)) {
			return undefined;
		}

		return attachments.map((attachment) =>
			Object.assign(
				{
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
				},
				attachment._unmappedProperties_,
			),
		);
	}

	_convertAttachmentsToApp(attachments) {
		if (typeof attachments === 'undefined' || !Array.isArray(attachments)) {
			return undefined;
		}

		const map = {
			collapsed: 'collapsed',
			color: 'color',
			text: 'text',
			timestampLink: 'message_link',
			thumbnailUrl: 'thumb_url',
			imageDimensions: 'image_dimensions',
			imagePreview: 'image_preview',
			imageUrl: 'image_url',
			imageType: 'image_type',
			imageSize: 'image_size',
			audioUrl: 'audio_url',
			audioType: 'audio_type',
			audioSize: 'audio_size',
			videoUrl: 'video_url',
			videoType: 'video_type',
			videoSize: 'video_size',
			fields: 'fields',
			actionButtonsAlignment: 'button_alignment',
			actions: 'actions',
			type: 'type',
			description: 'description',
			author: (attachment) => {
				const { author_name: name, author_link: link, author_icon: icon } = attachment;

				delete attachment.author_name;
				delete attachment.author_link;
				delete attachment.author_icon;

				return { name, link, icon };
			},
			title: (attachment) => {
				const { title: value, title_link: link, title_link_download: displayDownloadLink } = attachment;

				delete attachment.title;
				delete attachment.title_link;
				delete attachment.title_link_download;

				return { value, link, displayDownloadLink };
			},
			timestamp: (attachment) => {
				const result = new Date(attachment.ts);
				delete attachment.ts;
				return result;
			},
		};

		return attachments.map((attachment) => transformMappedData(attachment, map));
	}
}
