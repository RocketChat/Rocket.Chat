import type { IMessage, IRoom } from '@rocket.chat/core-typings';

import type { Upload } from './Upload';

export type ComposerAPI = {
	release(): void;
	readonly text: string;
	readonly selection: { readonly start: number; readonly end: number };
	setText(
		text: string,
		options?: {
			selection?:
				| { readonly start?: number; readonly end?: number }
				| ((previous: { readonly start: number; readonly end: number }) => { readonly start?: number; readonly end?: number });
		},
	): void;
	clear(): void;
	focus(): void;
	replyWith(text: string): Promise<void>;
	quoteMessage(message: IMessage): Promise<void>;
	dismissQuotedMessage(mid: IMessage['_id']): Promise<void>;
	dismissAllQuotedMessages(): Promise<void>;
	readonly quotedMessages: {
		get(): IMessage[];
		subscribe(callback: () => void): () => void;
	};
	setEditingMode(editing: boolean): void;
};

export type DataAPI = {
	composeMessage(
		text: string,
		options: { sendToChannel?: boolean; quotedMessages: IMessage[]; originalMessage?: IMessage },
	): Promise<IMessage>;
	findMessageByID(mid: IMessage['_id']): Promise<IMessage | undefined>;
	getMessageByID(mid: IMessage['_id']): Promise<IMessage>;
	findLastMessage(): Promise<IMessage | undefined>;
	getLastMessage(): Promise<IMessage>;
	findLastOwnMessage(): Promise<IMessage | undefined>;
	getLastOwnMessage(): Promise<IMessage>;
	findPreviousOwnMessage(message: IMessage): Promise<IMessage | undefined>;
	getPreviousOwnMessage(message: IMessage): Promise<IMessage>;
	findNextOwnMessage(message: IMessage): Promise<IMessage | undefined>;
	getNextOwnMessage(message: IMessage): Promise<IMessage>;
	pushEphemeralMessage(message: Omit<IMessage, 'rid' | 'tmid'>): Promise<void>;
	canUpdateMessage(message: IMessage): Promise<boolean>;
	updateMessage(message: Pick<IMessage, '_id' | 't'> & Partial<Omit<IMessage, '_id' | 't'>>): Promise<void>;
	canDeleteMessage(message: IMessage): Promise<boolean>;
	deleteMessage(mid: IMessage['_id']): Promise<void>;
	getDraft(mid: IMessage['_id'] | undefined): Promise<string | undefined>;
	discardDraft(mid: IMessage['_id'] | undefined): Promise<void>;
	saveDraft(mid: IMessage['_id'] | undefined, text: string): Promise<void>;
	findRoom(): Promise<IRoom | undefined>;
	getRoom(): Promise<IRoom>;
	isSubscribedToRoom(): Promise<boolean>;
	joinRoom(): Promise<void>;
	markRoomAsRead(): Promise<void>;
	findDiscussionByID(drid: IRoom['_id']): Promise<IRoom | undefined>;
	getDiscussionByID(drid: IRoom['_id']): Promise<IRoom>;
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
	readonly messageEditing: {
		toPreviousMessage(): Promise<void>;
		toNextMessage(): Promise<void>;
		editMessage(message: IMessage, options?: { cursorAtStart?: boolean }): Promise<void>;
	};
	readonly currentEditing:
		| {
				readonly mid: IMessage['_id'];
				reset(): Promise<boolean>;
				stop(): Promise<void>;
				cancel(): Promise<void>;
		  }
		| undefined;
	readonly flows: {
		readonly uploadFiles: (files: readonly File[]) => Promise<void>;
		readonly sendMessage: ({ text, tshow }: { text: string; tshow?: boolean }) => Promise<void>;
		readonly processSlashCommand: (message: IMessage) => Promise<boolean>;
		readonly processTooLongMessage: (message: IMessage) => Promise<boolean>;
		readonly processMessageEditing: (message: Pick<IMessage, '_id' | 't'> & Partial<Omit<IMessage, '_id' | 't'>>) => Promise<boolean>;
		readonly processSetReaction: (message: Pick<IMessage, 'msg'>) => Promise<boolean>;
		readonly requestMessageDeletion: (message: IMessage) => Promise<void>;
	};
};
