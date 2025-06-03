import { isMessageFromVisitor } from '@rocket.chat/core-typings';
import { Messages, Rooms, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { removeEmpty } from '@rocket.chat/tools';

import { cachedFunction } from './cachedFunction';
import { transformMappedData } from './transformMappedData';

export class AppMessagesConverter {
	mem = new WeakMap();

	constructor(orch) {
		this.orch = orch;
	}

	async convertById(msgId) {
		const msg = await Messages.findOneById(msgId);

		return this.convertMessage(msg);
	}

	async convertMessageRaw(msgObj) {
		if (!msgObj) {
			return undefined;
		}

		const { attachments, ...message } = msgObj;
		const getAttachments = async () => this._convertAttachmentsToApp(attachments);

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
			roomId: 'rid',
			editor: 'editedBy',
			attachments: getAttachments,
			sender: 'u',
			threadMsgCount: 'tcount',
			type: 't',
		};

		return transformMappedData(message, map);
	}

	async convertMessage(msgObj, cacheObj = msgObj) {
		if (!msgObj) {
			return undefined;
		}

		const cache =
			this.mem.get(cacheObj) ??
			new Map([
				['room', cachedFunction(this.orch.getConverters().get('rooms').convertById.bind(this.orch.getConverters().get('rooms')))],
				[
					'user.convertById',
					cachedFunction(this.orch.getConverters().get('users').convertById.bind(this.orch.getConverters().get('users'))),
				],
				[
					'user.convertToApp',
					cachedFunction(this.orch.getConverters().get('users').convertToApp.bind(this.orch.getConverters().get('users'))),
				],
			]);

		this.mem.set(cacheObj, cache);

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
			type: 't',
			room: async (message) => {
				const result = await cache.get('room')(message.rid);
				delete message.rid;
				return result;
			},
			editor: async (message) => {
				const { editedBy } = message;
				delete message.editedBy;

				if (!editedBy) {
					return undefined;
				}

				return cache.get('user.convertById')(editedBy._id);
			},
			attachments: async (message) => {
				const result = await this._convertAttachmentsToApp(message.attachments);
				delete message.attachments;
				return result;
			},
			sender: async (message) => {
				if (!message.u || !message.u._id) {
					return undefined;
				}

				// When the message contains token, means the message is from the visitor(omnichannel)
				const user = await (isMessageFromVisitor(msgObj)
					? cache.get('user.convertToApp')(message.u)
					: cache.get('user.convertById')(message.u._id));

				delete message.u;

				/**
				 * Old System Messages from visitor doesn't have the `token` field, to not return
				 * `sender` as undefined, so we need to add this fallback here.
				 */

				return user || cache.get('user.convertToApp')(message.u);
			},
		};

		return transformMappedData(msgObj, map);
	}

	async convertAppMessage(message, isPartial = false) {
		if (!message) {
			return undefined;
		}

		let rid;
		if (message.room?.id) {
			const room = await Rooms.findOneById(message.room.id, { projection: { _id: 1 } });
			rid = room?._id;
		}

		if (!rid && !isPartial) {
			throw new Error('Invalid room provided on the message.');
		}

		let u;
		if (message.sender?.id) {
			const user = await Users.findOneById(message.sender.id);

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
			const editor = await Users.findOneById(message.editor.id);
			editedBy = {
				_id: editor._id,
				username: editor.username,
			};
		}

		const attachments = this._convertAppAttachments(message.attachments);

		let _id = message.id;
		let ts = message.createdAt;

		if (!isPartial) {
			if (!message.id) {
				_id = Random.id();
			}

			if (!message.createdAt) {
				ts = new Date();
			}
		}

		const newMessage = {
			_id,
			...('threadId' in message && { tmid: message.threadId }),
			rid,
			u,
			msg: message.text,
			ts,
			_updatedAt: message.updatedAt,
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

		if (isPartial) {
			Object.entries(newMessage).forEach(([key, value]) => {
				if (typeof value === 'undefined') {
					delete newMessage[key];
				}
			});
		} else {
			Object.assign(newMessage, message._unmappedProperties_);
		}

		return newMessage;
	}

	_convertAppAttachments(attachments) {
		if (typeof attachments === 'undefined' || !Array.isArray(attachments)) {
			return undefined;
		}

		return attachments.map((attachment) =>
			removeEmpty({
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
				...attachment._unmappedProperties_,
			}),
		);
	}

	async _convertAttachmentsToApp(attachments) {
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

		return Promise.all(attachments.map(async (attachment) => transformMappedData(attachment, map)));
	}
}
