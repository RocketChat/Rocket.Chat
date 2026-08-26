import type { IMessage } from '@rocket.chat/core-typings';

/* The /v1/chat.* routes below are typed by their migrated implementations
 * (apps/meteor/server/api/v1/chat.ts augments `Endpoints` via
 * ExtractRoutesFromAPI), so the standalone `Endpoints` map from
 * @rocket.chat/rest-typings no longer declares them. This legacy SDK compiles
 * without that augmentation and keeps its own minimal response contracts,
 * mirroring the server responses. */

export type ChatSyncMessagesResponse = {
	result: {
		updated: IMessage[];
		deleted: { _id: IMessage['_id']; _deletedAt: string }[];
		cursor: {
			next: string | null;
			previous: string | null;
		};
	};
};

export type ChatSendMessageResponse = {
	message: IMessage;
};

export type ChatUpdateResponse = {
	message: IMessage;
};

export type ChatReactResponse = void;
