import { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';

import { Upload } from './Upload';

export type ComposerAPI = {
	release(): void;
	readonly text: string;
	setText(text: string): void;
	clear(): void;
	replyWith(text: string): Promise<void>;
	quoteMessage(message: IMessage): Promise<void>;
	dismissQuotedMessage(mid: IMessage['_id']): Promise<void>;
	dismissAllQuotedMessages(): Promise<void>;
	readonly quotedMessages: {
		get(): IMessage[];
		subscribe(callback: () => void): () => void;
	};
};

export type DataAPI = {
	findMessageByID(mid: IMessage['_id']): Promise<IMessage | undefined>;
	getMessageByID(mid: IMessage['_id']): Promise<IMessage>;
	findRoom(): Promise<IRoom | undefined>;
	getRoom(): Promise<IRoom>;
	findDiscussionByID(drid: IRoom['_id']): Promise<IRoom | undefined>;
	getDiscussionByID(drid: IRoom['_id']): Promise<IRoom>;
	findSubscriptionByRoomID(rid: IRoom['_id']): Promise<ISubscription | undefined>;
	getSubscriptionByRoomID(rid: IRoom['_id']): Promise<ISubscription>;
	deleteMessage(mid: IMessage['_id']): Promise<void>;
};

export type UploadsAPI = {
	get(): readonly Upload[];
	subscribe(callback: () => void): () => void;
	wipeFailedOnes(): void;
	cancel(id: Upload['id']): void;
	send(file: File, { description, msg }: { description?: string; msg?: string }): Promise<void>;
};

export type ChatAPI = {
	readonly composer?: ComposerAPI;
	readonly setComposerAPI: (composer: ComposerAPI) => void;
	readonly data: DataAPI;
	readonly uploads: UploadsAPI;
	readonly flows: {
		readonly uploadFiles: (files: readonly File[]) => Promise<void>;
		readonly sendMessage: ({ text, tshow }: { text: string; tshow?: boolean }) => Promise<void>;
	};
};
