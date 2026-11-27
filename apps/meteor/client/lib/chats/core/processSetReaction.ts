import type { IMessage, IRoom } from '@rocket.chat/core-typings';

import type { ChatAPI } from '../ChatAPI';

export type SetReactionChat = {
	readonly composer?: Pick<NonNullable<ChatAPI['composer']>, 'clear'>;
	readonly data: Pick<ChatAPI['data'], 'findLastMessage'>;
};

type ReactionUser = { username?: string };

export type SetReactionDeps = {
	getUserId(): string | undefined;
	getUser(): ReactionUser | undefined | null;
	getMessage(id: IMessage['_id']): IMessage | undefined;
	getRoom(rid: IRoom['_id']): IRoom | undefined;
	hasSubscription(rid: IRoom['_id']): boolean;
	emojiExists(shortcode: string): boolean;
	isReadOnly(room: IRoom, user: ReactionUser): boolean;
	updateMessage(predicate: (record: IMessage) => boolean, modifier: (record: IMessage) => IMessage): void;
	postReaction(params: { emoji: string; messageId: IMessage['_id'] }): Promise<unknown>;
	notifyError(error: unknown): void;
};

const runOptimisticSetReaction = (deps: SetReactionDeps, reaction: string, messageId: IMessage['_id']): void => {
	if (!deps.getUserId()) {
		return;
	}

	const user = deps.getUser();
	if (!user?.username) {
		return;
	}

	const message: IMessage | undefined = deps.getMessage(messageId);
	if (!message) {
		return;
	}

	const room = deps.getRoom(message.rid);
	if (!room) {
		return;
	}

	if (message.private) {
		return;
	}

	if (!deps.emojiExists(reaction)) {
		return;
	}

	if (deps.isReadOnly(room, user)) {
		return;
	}

	if (!deps.hasSubscription(message.rid)) {
		return;
	}

	const { username } = user;

	deps.updateMessage(
		(record) => record._id === messageId,
		(record) => {
			const currentReactions = record.reactions ?? {};
			const hasReacted = currentReactions[reaction]?.usernames.includes(username) ?? false;

			const reactions: NonNullable<IMessage['reactions']> = {};

			for (const [name, value] of Object.entries(currentReactions)) {
				if (name !== reaction) {
					reactions[name] = value;
					continue;
				}

				const usernames = hasReacted ? value.usernames.filter((u) => u !== username) : [...value.usernames, username];

				if (usernames.length > 0) {
					reactions[name] = { ...value, usernames };
				}
			}

			if (!currentReactions[reaction]) {
				reactions[reaction] = { usernames: [username] };
			}

			if (Object.keys(reactions).length === 0) {
				const { reactions: _, ...rest } = record;
				return rest;
			}

			return { ...record, reactions };
		},
	);
};

export const processSetReactionCore = async (
	deps: SetReactionDeps,
	chat: SetReactionChat,
	{ msg }: Pick<IMessage, 'msg'>,
): Promise<boolean> => {
	const match = msg.trim().match(/^\+(:.*?:)$/m);
	if (!match) {
		return false;
	}

	const [, reaction] = match;
	if (!deps.emojiExists(reaction)) {
		return false;
	}

	const lastMessage = await chat.data.findLastMessage();

	if (!lastMessage) {
		return false;
	}

	chat.composer?.clear();
	runOptimisticSetReaction(deps, reaction, lastMessage._id);
	try {
		await deps.postReaction({ emoji: reaction, messageId: lastMessage._id });
	} catch (error) {
		deps.notifyError(error);
		throw error;
	}
	return true;
};
