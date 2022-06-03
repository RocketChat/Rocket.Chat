/* eslint-disable @typescript-eslint/camelcase */
import { Random } from 'meteor/random';
import { IMessage as IMessageFromAppsEngine, IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { IEditedMessage, IMessage, MessageAttachment, MessageAttachmentDefault } from '@rocket.chat/core-typings';

import { Messages, Rooms, Users } from '../../../models/server';
import { transformMappedData } from '../../lib/misc/transformMappedData';
import { AppServerOrchestrator } from '../orchestrator';

export class AppMessagesConverter {
	orch: AppServerOrchestrator;

	constructor(orch: AppServerOrchestrator) {
		this.orch = orch;
	}

	convertById(msgId: string): IMessageFromAppsEngine | undefined {
		const msg = Messages.findOneById(msgId);

		return this.convertMessage(msg);
	}

	convertMessage(msgObj: IMessage): IMessageFromAppsEngine | undefined {
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
			room: (message: IMessage): IRoom => {
				const result = this.orch.getConverters()?.get('rooms').convertById(message.rid);
				delete (message as any).rid; // The operand of a 'delete' operator must be optional.ts(2790)
				return result;
			},
			editor: (message: IEditedMessage): IUser | undefined => {
				const { editedBy } = message;
				delete (message as any).editedBy; // The operand of a 'delete' operator must be optional.ts(2790)

				if (!editedBy) {
					return undefined;
				}

				return this.orch.getConverters()?.get('users').convertById(editedBy._id);
			},
			attachments: (message: IMessage): unknown => {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				const result = this._convertAttachmentsToApp(message.attachments!);
				delete message.attachments;
				return result;
			},
			sender: (message: IMessage): IUser | undefined => {
				if (!message.u || !message.u._id) {
					return undefined;
				}

				let user = this.orch.getConverters()?.get('users').convertById(message.u._id);

				// When the sender of the message is a Guest (livechat) and not a user
				if (!user) {
					user = this.orch.getConverters()?.get('users').convertToApp(message.u);
				}

				delete (message as any).u; // The operand of a 'delete' operator must be optional.ts(2790)

				return user;
			},
		};

		return transformMappedData(msgObj, map) as IMessageFromAppsEngine & {
			_unmappedProperties_: any;
		};
	}

	convertAppMessage(message: IMessageFromAppsEngine): IMessage | undefined {
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

		if (message.editedAt && message.editor) {
			const editor = Users.findOneById(message.editor.id);
			editedBy = {
				_id: editor._id,
				username: editor.username,
			};
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const attachments = this._convertAppAttachments(message.attachments!);

		return {
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
			// TODO: Chapter day APPSengine check token
			...('token' in message && { token: (message as any).token }),
			...(message as any)._unmappedProperties_,
		};
	}

	private _convertAppAttachments(attachments: IMessageAttachment[]): MessageAttachment[] | undefined {
		if (!Array.isArray(attachments)) {
			return undefined;
		}

		return attachments.map((attachment) => ({
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
			image_url: attachment.imageUrl,
			audio_url: attachment.audioUrl,
			video_url: attachment.videoUrl,
			image_dimensions: (attachment as any).imageDimensions,
			image_preview: (attachment as any).imagePreview,
			image_type: (attachment as any).imageType,
			image_size: (attachment as any).imageSize,
			audio_type: (attachment as any).audioType,
			audio_size: (attachment as any).audioSize,
			video_type: (attachment as any).videoType,
			video_size: (attachment as any).videoSize,
			fields: attachment.fields,
			button_alignment: attachment.actionButtonsAlignment,
			actions: attachment.actions,
			type: attachment.type,
			description: attachment.description,
			...(attachment as any)._unmappedProperties_,
		}));
	}

	private _convertAttachmentsToApp(attachments: MessageAttachmentDefault[]):
		| (IMessageAttachment &
				{
					_unmappedProperties_: unknown;
				}[])
		| undefined {
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
			author: (attachment: MessageAttachmentDefault): { name: string | undefined; link: string | undefined; icon: string | undefined } => {
				const { author_name: name, author_link: link, author_icon: icon } = attachment;

				delete attachment.author_name;
				delete attachment.author_link;
				delete attachment.author_icon;

				return { name, link, icon };
			},
			title: (
				attachment: MessageAttachment,
			): { value: string | undefined; link: string | undefined; displayDownloadLink: boolean | undefined } => {
				const { title: value, title_link: link, title_link_download: displayDownloadLink } = attachment;

				delete attachment.title;
				delete attachment.title_link;
				delete attachment.title_link_download;

				return { value, link, displayDownloadLink };
			},
			timestamp: (attachment: MessageAttachmentDefault): Date => {
				const result = attachment.ts ? new Date(attachment.ts) : new Date();
				delete attachment.ts;
				return result;
			},
		};

		return attachments.map((attachment) => transformMappedData(attachment, map));
	}
}
