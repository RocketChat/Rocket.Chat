import type { IImportMessageRecord, IMessage as IDBMessage, IImportMessage, IImportMessageReaction } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';
import limax from 'limax';

import type { UserIdentification, MentionedChannel } from './ConverterCache';
import { RecordConverter } from './RecordConverter';
import { insertMessage } from '../../../../lib/server/functions/insertMessage';
import type { IConversionCallbacks } from '../../definitions/IConversionCallbacks';

export type MessageConversionCallbacks = IConversionCallbacks & { afterImportAllMessagesFn?: (roomIds: string[]) => Promise<void> };

type MessageObject = Record<string, any>;

type MentionedUser = {
	_id: string;
	username: string;
	name?: string;
};

type IMessageReaction = {
	name: string;
	usernames: string[];
};

type IMessageReactions = Record<string, IMessageReaction>;

export class MessageConverter extends RecordConverter<IImportMessageRecord> {
	private rids: string[] = [];

	async convertData({ afterImportAllMessagesFn, ...callbacks }: MessageConversionCallbacks = {}): Promise<void> {
		this.rids = [];
		await super.convertData(callbacks);

		await this.resetLastMessages();
		if (afterImportAllMessagesFn) {
			await afterImportAllMessagesFn(this.rids);
		}
	}

	protected async resetLastMessages(): Promise<void> {
		for await (const rid of this.rids) {
			try {
				await Rooms.resetLastMessageById(rid, null);
			} catch (e) {
				this._logger.warn(`Failed to update last message of room ${rid}`);
				this._logger.error(e);
			}
		}
	}

	protected async insertMessage(data: IImportMessage): Promise<void> {
		if (!data.ts || isNaN(data.ts as unknown as number)) {
			throw new Error('importer-message-invalid-timestamp');
		}

		const creator = await this._cache.findImportedUser(data.u._id);
		if (!creator) {
			this._logger.warn(`Imported user not found: ${data.u._id}`);
			throw new Error('importer-message-unknown-user');
		}
		const rid = await this._cache.findImportedRoomId(data.rid);
		if (!rid) {
			throw new Error('importer-message-unknown-room');
		}
		if (!this.rids.includes(rid)) {
			this.rids.push(rid);
		}

		const msgObj = await this.buildMessageObject(data, rid, creator);

		try {
			await insertMessage(creator, msgObj as unknown as IDBMessage, rid, true);
		} catch (e) {
			this._logger.warn(`Failed to import message with timestamp ${String(msgObj.ts)} to room ${rid}`);
			this._logger.error(e);
		}
	}

	protected async convertRecord(record: IImportMessageRecord): Promise<boolean> {
		await this.insertMessage(record.data);
		return true;
	}

	protected async buildMessageObject(data: IImportMessage, rid: string, creator: UserIdentification): Promise<MessageObject> {
		// Convert the mentions and channels first because these conversions can also modify the msg in the message object
		const mentions = data.mentions && (await this.convertMessageMentions(data));
		const channels = data.channels && (await this.convertMessageChannels(data));

		return {
			rid,
			u: {
				_id: creator._id,
				username: creator.username,
			},
			msg: data.msg,
			ts: data.ts,
			t: data.t || undefined,
			groupable: data.groupable,
			tmid: data.tmid,
			tlm: data.tlm,
			tcount: data.tcount,
			replies: data.replies && (await this.convertMessageReplies(data.replies)),
			editedAt: data.editedAt,
			editedBy: data.editedBy && ((await this._cache.findImportedUser(data.editedBy)) || undefined),
			mentions,
			channels,
			_importFile: data._importFile,
			url: data.url,
			attachments: data.attachments,
			bot: data.bot,
			emoji: data.emoji,
			alias: data.alias,
			...(data._id ? { _id: data._id } : {}),
			...(data.reactions ? { reactions: await this.convertMessageReactions(data.reactions) } : {}),
		};
	}

	protected async convertMessageChannels(message: IImportMessage): Promise<MentionedChannel[] | undefined> {
		const { channels } = message;
		if (!channels) {
			return;
		}

		const result: MentionedChannel[] = [];
		for await (const importId of channels) {
			const { name, _id } = (await this.getMentionedChannelData(importId)) || {};

			if (!_id || !name) {
				this._logger.warn(`Mentioned room not found: ${importId}`);
				continue;
			}

			message.msg = message.msg.replace(new RegExp(`\#${importId}`, 'gi'), `#${name}`);

			result.push({
				_id,
				name,
			});
		}

		return result;
	}

	protected async convertMessageMentions(message: IImportMessage): Promise<MentionedUser[] | undefined> {
		const { mentions } = message;
		if (!mentions) {
			return undefined;
		}

		const result: MentionedUser[] = [];
		for await (const importId of mentions) {
			if (importId === ('all' as 'string') || importId === 'here') {
				result.push({
					_id: importId,
					username: importId,
				});
				continue;
			}

			// Loading the name will also store the remaining data on the cache if it's missing, so this won't run two queries
			const name = await this._cache.findImportedUserDisplayName(importId);
			const data = await this._cache.findImportedUser(importId);

			if (!data) {
				this._logger.warn(`Mentioned user not found: ${importId}`);
				continue;
			}

			if (!data.username) {
				this._logger.debug(importId);
				throw new Error('importer-message-mentioned-username-not-found');
			}

			message.msg = message.msg.replace(new RegExp(`\@${importId}`, 'gi'), `@${data.username}`);

			result.push({
				_id: data._id,
				username: data.username as 'string',
				name,
			});
		}
		return result;
	}

	protected async convertMessageReactions(
		importedReactions: Record<string, IImportMessageReaction>,
	): Promise<undefined | IMessageReactions> {
		const reactions: IMessageReactions = {};

		for await (const name of Object.keys(importedReactions)) {
			if (!importedReactions.hasOwnProperty(name)) {
				continue;
			}
			const { users } = importedReactions[name];

			if (!users.length) {
				continue;
			}

			const reaction: IMessageReaction = {
				name,
				usernames: [],
			};

			for await (const importId of users) {
				const username = await this._cache.findImportedUsername(importId);
				if (username && !reaction.usernames.includes(username)) {
					reaction.usernames.push(username);
				}
			}

			if (reaction.usernames.length) {
				reactions[name] = reaction;
			}
		}

		if (Object.keys(reactions).length > 0) {
			return reactions;
		}
	}

	protected async convertMessageReplies(replies: string[]): Promise<string[]> {
		const result: string[] = [];
		for await (const importId of replies) {
			const userId = await this._cache.findImportedUserId(importId);
			if (userId && !result.includes(userId)) {
				result.push(userId);
			}
		}
		return result;
	}

	protected async getMentionedChannelData(importId: string): Promise<MentionedChannel | undefined> {
		// loading the name will also store the id on the cache if it's missing, so this won't run two queries
		const name = await this._cache.findImportedRoomName(importId);
		const _id = await this._cache.findImportedRoomId(importId);

		if (name && _id) {
			return {
				name,
				_id,
			};
		}

		// If the importId was not found, check if we have a room with that name
		const roomName = limax(importId.trim(), { maintainCase: true });

		const room = await Rooms.findOneByNonValidatedName(roomName, { projection: { name: 1 } });
		if (room?.name) {
			this._cache.addRoom(importId, room._id);
			this._cache.addRoomName(importId, room.name);

			return {
				name: room.name,
				_id: room._id,
			};
		}
	}

	protected getDataType(): 'message' {
		return 'message';
	}
}
