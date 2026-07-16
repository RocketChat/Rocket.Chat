import type { IAppMessagesConverter, IAppServerOrchestrator, IAppsMessage, IAppsMesssageRaw } from '@rocket.chat/apps';
import { isMessageFromVisitor } from '@rocket.chat/core-typings';
import type { IMessage } from '@rocket.chat/core-typings';
import { Messages, Rooms, Users } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { removeEmpty } from '@rocket.chat/tools';

import { cachedFunction } from './cachedFunction';
import { convertMessageFiles } from './convertMessageFiles';
import { transformMappedData } from './transformMappedData';

// The stored message documents and the app-side payloads carry many optional/dynamic fields that are
// awkward to express against the base `IMessage`/`IAppsMessage` types. The legacy converter accessed
// them dynamically; until this converter is migrated to a codec we treat the transform inputs as
// loosely-typed records to preserve that behaviour verbatim.
type MessageData = Record<string, any>;

export class AppMessagesConverter implements IAppMessagesConverter {
	private mem = new WeakMap<object, Map<string, any>>();

	constructor(protected readonly orch: IAppServerOrchestrator) {
		this.orch = orch;
	}

	async convertById(msgId: IMessage['_id']): Promise<IAppsMessage | undefined> {
		const msg = await Messages.findOneById(msgId);

		return this.convertMessage(msg);
	}

	convertMessageRaw(msgObj: IMessage): Promise<IAppsMesssageRaw>;

	convertMessageRaw(msgObj: IMessage | undefined | null): Promise<IAppsMesssageRaw | undefined>;

	async convertMessageRaw(msgObj: IMessage | undefined | null): Promise<IAppsMesssageRaw | undefined> {
		if (!msgObj) {
			return undefined;
		}

		const { attachments, ...message } = msgObj;
		const getAttachments = async () => this._convertAttachmentsToApp(attachments, (msgObj as MessageData).file);

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
			files: 'files',
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
		} as const;

		return transformMappedData(message, map) as unknown as Promise<IAppsMesssageRaw>;
	}

	convertMessage(msgObj: undefined | null): Promise<undefined>;

	convertMessage(msgObj: IMessage, cacheObj?: object): Promise<IAppsMessage>;

	convertMessage(msgObj: IMessage | undefined | null, cacheObj?: object): Promise<IAppsMessage | undefined>;

	async convertMessage(
		msgObj: IMessage | undefined | null,
		cacheObj: object | undefined = msgObj ?? undefined,
	): Promise<IAppsMessage | undefined> {
		if (!msgObj) {
			return undefined;
		}

		const cache =
			this.mem.get(cacheObj as object) ??
			new Map<string, any>([
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

		this.mem.set(cacheObj as object, cache);

		const { attachments, file: mainFile } = msgObj as MessageData;

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
			files: async (message: MessageData) => convertMessageFiles(message.files, attachments),
			room: async (message: MessageData) => {
				const result = await cache.get('room')(message.rid);
				delete message.rid;
				return result;
			},
			editor: async (message: MessageData) => {
				const { editedBy } = message;
				delete message.editedBy;

				if (!editedBy) {
					return undefined;
				}

				return cache.get('user.convertById')(editedBy._id);
			},
			attachments: async (message: MessageData) => {
				const result = await this._convertAttachmentsToApp(message.attachments, mainFile);
				delete message.attachments;
				return result;
			},
			sender: async (message: MessageData) => {
				if (!message.u?._id) {
					return undefined;
				}

				// Keep a reference to the original sender before it is deleted below, so the fallback still has it.
				const sender = message.u;

				// When the message contains token, means the message is from the visitor(omnichannel)
				const user = await (isMessageFromVisitor(msgObj)
					? cache.get('user.convertToApp')(sender)
					: cache.get('user.convertById')(sender._id));

				delete message.u;

				/**
				 * Old System Messages from visitor doesn't have the `token` field, to not return
				 * `sender` as undefined, so we need to add this fallback here.
				 */

				return user || cache.get('user.convertToApp')(sender);
			},
		} as const;

		return transformMappedData(msgObj, map) as unknown as Promise<IAppsMessage>;
	}

	convertAppMessage(message: undefined | null): Promise<undefined>;

	convertAppMessage(message: IAppsMessage): Promise<IMessage | undefined>;

	convertAppMessage(message: IAppsMessage, isPartial: boolean): Promise<Partial<IMessage>>;

	async convertAppMessage(message: any, isPartial = false): Promise<Partial<IMessage> | undefined> {
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
			// Fall back to the editor data carried on the app payload when the user no longer exists,
			// mirroring the sender handling above instead of dereferencing a possibly-null lookup.
			editedBy = editor
				? {
						_id: editor._id,
						username: editor.username,
					}
				: {
						_id: message.editor.id,
						username: message.editor.username,
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

		const newMessage: MessageData = {
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

		return newMessage as unknown as Partial<IMessage>;
	}

	_convertAppAttachments(attachments: any) {
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

	async _convertAttachmentsToApp(attachments: any, mainFile: any) {
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
			author: (attachment: MessageData) => {
				const { author_name: name, author_link: link, author_icon: icon } = attachment;

				delete attachment.author_name;
				delete attachment.author_link;
				delete attachment.author_icon;

				return { name, link, icon };
			},
			title: (attachment: MessageData) => {
				const { title: value, title_link: link, title_link_download: displayDownloadLink } = attachment;

				delete attachment.title;
				delete attachment.title_link;
				delete attachment.title_link_download;

				return { value, link, displayDownloadLink };
			},
			timestamp: (attachment: MessageData) => {
				const result = new Date(attachment.ts);
				delete attachment.ts;
				return result;
			},
			fileId: (attachment: MessageData) => {
				// If the attachment is missing the fileId, but there's only one file in the message, use that file's ID
				if (!attachment.fileId && attachment.type === 'file' && mainFile?._id && attachments.length === 1) {
					return mainFile._id;
				}

				return attachment.fileId;
			},
		} as const;

		return Promise.all(attachments.map(async (attachment) => transformMappedData(attachment, map)));
	}
}
