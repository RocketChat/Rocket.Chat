import type { IMessage, IRoom, ISubscription, IE2EEMessage, IUpload, Subscribable } from '@rocket.chat/core-typings';
import type { IActionManager } from '@rocket.chat/ui-contexts';

import type { Upload } from './Upload';
import type { ReadStateManager } from './readStateManager';
import type { FormattingButton } from '../../../app/ui-message/client/messageBox/messageBoxFormatting';

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
	wrapSelection(pattern: string): void;
	insertText(text: string): void;
	insertNewLine(): void;
	clear(): void;
	focus(): void;
	blur(): void;

	getCursorPosition(): number | undefined;

	substring(start: number, end?: number): string;

	replaceText(
		text: string,
		selection: {
			start: number;
			end: number;
		},
	): void;

	setCursorToEnd(): void;
	setCursorToStart(): void;
	replyWith(text: string): Promise<void>;
	quoteMessage(message: IMessage): Promise<void>;
	dismissQuotedMessage(mid: IMessage['_id']): Promise<void>;
	dismissAllQuotedMessages(): Promise<void>;
	readonly quotedMessages: Subscribable<IMessage[]>;

	setEditingMode(editing: boolean): void;
	readonly editing: Subscribable<boolean>;

	setRecordingMode(recording: boolean): void;
	readonly recording: Subscribable<boolean>;

	setRecordingVideo(recording: boolean): void;
	readonly recordingVideo: Subscribable<boolean>;

	setIsMicrophoneDenied(isMicrophoneDenied: boolean): void;
	readonly isMicrophoneDenied: Subscribable<boolean>;

	readonly formatters: Subscribable<FormattingButton[]>;
};

export type DataAPI = {
	composeMessage(
		text: string,
		options: { sendToChannel?: boolean; quotedMessages: IMessage[]; originalMessage?: IMessage | null },
	): Promise<IMessage>;
	findMessageByID(mid: IMessage['_id']): Promise<IMessage | null>;
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
	updateMessage(message: Pick<IMessage, '_id' | 't'> & Partial<Omit<IMessage, '_id' | 't'>>, previewUrls?: string[]): Promise<void>;
	canDeleteMessage(message: IMessage): Promise<boolean>;
	deleteMessage(msgIdOrMsg: IMessage | IMessage['_id']): Promise<void>;
	getDraft(mid: IMessage['_id'] | undefined): Promise<string | undefined>;
	discardDraft(mid: IMessage['_id'] | undefined): Promise<void>;
	saveDraft(mid: IMessage['_id'] | undefined, text: string): Promise<void>;
	findRoom(): Promise<IRoom | undefined>;
	getRoom(): Promise<IRoom>;
	isSubscribedToRoom(): Promise<boolean>;
	joinRoom(): Promise<void>;
	findDiscussionByID(drid: IRoom['_id']): Promise<IRoom | undefined>;
	getDiscussionByID(drid: IRoom['_id']): Promise<IRoom>;
	findSubscription(): Promise<ISubscription | undefined>;
	getSubscription(): Promise<ISubscription>;
	findSubscriptionFromMessage(message: IMessage): Promise<ISubscription | undefined>;
	getSubscriptionFromMessage(message: IMessage): Promise<ISubscription>;
};

export type UploadsAPI = {
	get(): readonly Upload[];
	subscribe(callback: () => void): () => void;
	wipeFailedOnes(): void;
	cancel(id: Upload['id']): void;
	send(
		file: File,
		{ description, msg, t, e2e }: { description?: string; msg?: string; t?: IMessage['t']; e2e?: IMessage['e2e'] },
		getContent?: (fileId: string, fileUrl: string) => Promise<IE2EEMessage['content']>,
		fileContent?: { raw: Partial<IUpload>; encrypted: IE2EEMessage['content'] },
	): Promise<void>;
};

export type ChatAPI = {
	readonly uid: string | null;
	readonly composer?: ComposerAPI;
	readonly setComposerAPI: (composer?: ComposerAPI) => void;
	readonly data: DataAPI;
	readonly uploads: UploadsAPI;
	readonly readStateManager: ReadStateManager;
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

	readonly emojiPicker: {
		open(el: Element, cb: (emoji: string) => void): void;
		close(): void;
	};

	readonly action: {
		start(action: 'typing'): void;
		stop(action: 'typing' | 'recording' | 'uploading' | 'playing'): void;
		performContinuously(action: 'recording' | 'uploading' | 'playing'): void;
	};

	ActionManager: IActionManager;

	readonly flows: {
		readonly uploadFiles: (files: readonly File[], resetFileInput?: () => void) => Promise<void>;
		readonly sendMessage: ({
			text,
			tshow,
		}: {
			text: string;
			tshow?: boolean;
			previewUrls?: string[];
			isSlashCommandAllowed?: boolean;
		}) => Promise<boolean>;
		readonly processSlashCommand: (message: IMessage, userId: string | null) => Promise<boolean>;
		readonly processTooLongMessage: (message: IMessage) => Promise<boolean>;
		readonly processMessageEditing: (
			message: Pick<IMessage, '_id' | 't'> & Partial<Omit<IMessage, '_id' | 't'>>,
			previewUrls?: string[],
		) => Promise<boolean>;
		readonly processSetReaction: (message: Pick<IMessage, 'msg'>) => Promise<boolean>;
		readonly requestMessageDeletion: (message: IMessage) => Promise<void>;
		readonly replyBroadcast: (message: IMessage) => Promise<void>;
	};
};
