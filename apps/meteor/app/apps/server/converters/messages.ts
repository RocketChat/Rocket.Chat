/* eslint-disable @typescript-eslint/camelcase */
import { Random } from 'meteor/random';
import type {
	AudioAttachmentProps,
	IEditedMessage,
	ImageAttachmentProps,
	IMessage,
	MessageAttachment,
	MessageAttachmentAction,
	MessageAttachmentDefault,
	MessageQuoteAttachment,
	VideoAttachmentProps,
} from '@rocket.chat/core-typings';

import { Messages, Rooms, Users } from '../../../models/server';
import { transformMappedData } from '../../lib/misc/transformMappedData';
import { AppServerOrchestrator } from '../orchestrator';

export class AppMessagesConverter {
	orch: AppServerOrchestrator;

	constructor(orch: AppServerOrchestrator) {
		this.orch = orch;
	}

	convertById(msgId: string): unknown {
		const msg = Messages.findOneById(msgId);

		return this.convertMessage(msg);
	}

	convertMessage(msgObj: IMessage): unknown {
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
			room: (message: IMessage): unknown => {
				const result = this.orch.getConverters()?.get('rooms').convertById(message.rid);
				delete (message as any).rid; // The operand of a 'delete' operator must be optional.ts(2790)
				return result;
			},
			editor: (message: IEditedMessage): unknown => {
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
			sender: (message: IMessage): unknown => {
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

		return transformMappedData(msgObj, map);
	}

	convertAppMessage(message: IEditedMessage): unknown {
		if (!message || !message.rid) {
			return undefined;
		}

		const room = Rooms.findOneById(message.rid);

		if (!room) {
			throw new Error('Invalid room provided on the message.');
		}

		let u;
		if (message.u && message.u._id) {
			const user = Users.findOneById(message.u._id);

			if (user) {
				u = {
					_id: user._id,
					username: user.username,
					name: user.name,
				};
			} else {
				u = {
					_id: message.u._id,
					username: message.u.username,
					name: message.u.name,
				};
			}
		}

		let editedBy;
		if (message.editedBy) {
			const editor = Users.findOneById(message.editedBy._id);
			editedBy = {
				_id: editor._id,
				username: editor.username,
			};
		}

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const attachments = this._convertAppAttachments(message.attachments!);

		const newMessage = {
			_id: message._id || Random.id(),
			...('threadId' in message && { tmid: message.tmid }),
			rid: room._id,
			u,
			msg: message.msg,
			ts: message.ts || new Date(),
			_updatedAt: message.editedAt || new Date(),
			...(editedBy && { editedBy }),
			...('editedAt' in message && { editedAt: message.editedAt }),
			...('emoji' in message && { emoji: message.emoji }),
			...('avatarUrl' in message && { avatar: message.avatar }),
			...('alias' in message && { alias: message.alias }),
			...('customFields' in message && { customFields: (message as any).customFields }),
			...('groupable' in message && { groupable: message.groupable }),
			...(attachments && { attachments }),
			...('reactions' in message && { reactions: message.reactions }),
			...('parseUrls' in message && { parseUrls: message.urls }),
			...('blocks' in message && { blocks: message.blocks }),
			...('token' in message && { token: (message as any).token }),
		};

		return Object.assign(newMessage, (message as any)._unmappedProperties_);
	}

	_convertAppAttachments(attachments: MessageAttachment[]): unknown[] | undefined {
		if (typeof attachments === 'undefined' || !Array.isArray(attachments)) {
			return undefined;
		}

		return attachments.map((attachment) =>
			Object.assign(
				{
					collapsed: attachment.collapsed,
					color: (attachment as MessageAttachmentDefault).color,
					text: (attachment as MessageAttachmentDefault).text,
					ts: attachment.ts ? attachment.ts.toJSON() : attachment.ts,
					message_link: (attachment as MessageQuoteAttachment).message_link,
					thumb_url: (attachment as MessageAttachmentDefault).thumb_url,
					author_name: (attachment as MessageAttachmentDefault).author_name
						? (attachment as MessageAttachmentDefault).author_name
						: undefined,
					author_link: (attachment as MessageAttachmentDefault).author_link
						? (attachment as MessageAttachmentDefault).author_link
						: undefined,
					author_icon: (attachment as MessageAttachmentDefault).author_icon
						? (attachment as MessageAttachmentDefault).author_icon
						: undefined,
					title: attachment.title ? attachment.title : undefined,
					title_link: attachment.title ? attachment.title_link : undefined,
					title_link_download: attachment.title ? attachment.title_link_download : undefined,
					image_dimensions: (attachment as MessageAttachmentDefault).image_dimensions,
					image_preview: (attachment as ImageAttachmentProps).image_preview,
					image_url: (attachment as MessageAttachmentDefault).image_url,
					image_type: (attachment as ImageAttachmentProps).image_type,
					image_size: (attachment as ImageAttachmentProps).image_size,
					audio_url: (attachment as AudioAttachmentProps).audio_url,
					audio_type: (attachment as AudioAttachmentProps).audio_type,
					audio_size: (attachment as AudioAttachmentProps).audio_size,
					video_url: (attachment as VideoAttachmentProps).video_url,
					video_type: (attachment as VideoAttachmentProps).video_type,
					video_size: (attachment as VideoAttachmentProps).video_size,
					fields: (attachment as MessageAttachmentDefault).fields,
					button_alignment: (attachment as MessageAttachmentAction).button_alignment,
					actions: (attachment as MessageAttachmentAction).actions,
					type: (attachment as any).type,
					description: attachment.description,
				},
				(attachment as any)._unmappedProperties_,
			),
		);
	}

	_convertAttachmentsToApp(attachments: MessageAttachmentDefault[]):
		| {
				_unmappedProperties_: unknown;
		  }[]
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
