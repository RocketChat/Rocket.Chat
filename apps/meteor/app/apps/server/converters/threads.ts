import type { IAppRoomsConverter, IAppThreadsConverter, IAppUsersConverter, IAppsUser } from '@rocket.chat/apps';
import type { IMessage as AppsEngineMessage } from '@rocket.chat/apps-engine/definition/messages';
import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import type { IUser } from '@rocket.chat/core-typings';
import { isEditedMessage, type IMessage } from '@rocket.chat/core-typings';
import { Messages } from '@rocket.chat/models';

import { transformMappedData } from './transformMappedData';

// eslint-disable-next-line @typescript-eslint/naming-convention
interface Orchestrator {
	rooms: () => {
		convertById: IAppRoomsConverter['convertById'];
	};
	users: () => {
		convertById: IAppUsersConverter['convertById'];
		convertToApp: IAppUsersConverter['convertToApp'];
	};
}

const cachedFunction = <F extends (...args: any[]) => any>(fn: F) => {
	const cache = new Map<string, unknown>();

	return ((...args) => {
		const cacheKey = JSON.stringify(args);

		if (cache.has(cacheKey)) {
			return cache.get(cacheKey) as ReturnType<F>;
		}

		const result = fn(...args);

		cache.set(cacheKey, result);

		return result;
	}) as F;
};

export class AppThreadsConverter implements IAppThreadsConverter {
	constructor(
		private readonly orch: {
			getConverters: () => {
				get: <O extends keyof Orchestrator>(key: O) => ReturnType<Orchestrator[O]>;
			};
		},
	) {
		this.orch = orch;
	}

	async convertById(threadId: string) {
		const query = {
			$or: [
				{
					_id: threadId,
				},
				{
					tmid: threadId,
				},
			],
		};

		const mainMessage = await Messages.findOneById(threadId);

		if (!mainMessage) {
			return [];
		}

		const replies = await Messages.find(query).toArray();

		const room = (await this.orch.getConverters().get('rooms').convertById(mainMessage.rid)) as IRoom | undefined;

		if (!room) {
			return [];
		}

		const convertToApp = cachedFunction(this.orch.getConverters().get('users').convertToApp.bind(this.orch.getConverters().get('users')));

		const convertUserById = cachedFunction(this.orch.getConverters().get('users').convertById.bind(this.orch.getConverters().get('users')));

		return Promise.all([mainMessage, ...replies].map((msg) => this.convertMessage(msg, room, convertUserById, convertToApp)));
	}

	async convertMessage(
		msgObj: IMessage,
		room: IRoom,
		convertUserById: ReturnType<Orchestrator['users']>['convertById'],
		convertToApp: ReturnType<Orchestrator['users']>['convertToApp'],
	): Promise<AppsEngineMessage> {
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
			room: () => room,
			editor: async (message: IMessage) => {
				if (!isEditedMessage(message)) {
					return undefined;
				}

				const { editedBy } = message;

				return convertUserById(editedBy._id);
			},
			attachments: async (message: IMessage) => {
				if (!message.attachments) {
					return undefined;
				}
				const result = await this._convertAttachmentsToApp(message.attachments);
				delete message.attachments;
				return result;
			},
			sender: async (message: IMessage): Promise<IAppsUser> => {
				// #TODO: #AppsEngineTypes - Remove explicit types and typecasts once the apps-engine definition/implementation mismatch is fixed.
				if (!message.u?._id) {
					return undefined as unknown as IAppsUser;
				}

				let user: IAppsUser | undefined = await convertUserById(message.u._id);

				// When the sender of the message is a Guest (livechat) and not a user
				if (!user) {
					user = await convertToApp(message.u as unknown as IUser);
				}

				return user as IAppsUser;
			},
		} as const;

		// #TODO: #AppsEngineTypes - Remove explicit types and typecasts once the apps-engine definition/implementation mismatch is fixed.
		const msgData = {
			...msgObj,
			reactions: msgObj.reactions as unknown as AppsEngineMessage['reactions'],
		} as IMessage & { reactions?: AppsEngineMessage['reactions'] };

		return transformMappedData(msgData, map);
	}

	async _convertAttachmentsToApp(attachments: NonNullable<IMessage['attachments']>) {
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
			author: (attachment: NonNullable<IMessage['attachments']>[number]) => {
				if (!('author_name' in attachment)) {
					return;
				}

				const { author_name: name, author_link: link, author_icon: icon } = attachment;

				delete attachment.author_name;
				delete attachment.author_link;
				delete attachment.author_icon;

				return { name, link, icon };
			},
			title: (attachment: NonNullable<IMessage['attachments']>[number]) => {
				const { title: value, title_link: link, title_link_download: displayDownloadLink } = attachment;

				delete attachment.title;
				delete attachment.title_link;
				delete attachment.title_link_download;

				return { value, link, displayDownloadLink };
			},
			timestamp: (attachment: NonNullable<IMessage['attachments']>[number]) => {
				const result = attachment.ts ? new Date(attachment.ts) : undefined;
				delete attachment.ts;
				return result;
			},
		};

		return Promise.all(attachments.map(async (attachment) => transformMappedData(attachment, map)));
	}
}
