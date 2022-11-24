import { IMessage } from '@rocket.chat/core-typings';

import { Upload } from './Upload';

export type ChatAPI = {
	readonly composer?: {
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
	readonly allMessages: {
		findOneByID(mid: IMessage['_id']): Promise<IMessage | undefined>;
		getOneByID(mid: IMessage['_id']): Promise<IMessage>;
	};
	readonly sendMessage: ({ text, tshow }: { text: string; tshow?: boolean }) => Promise<void>;
	readonly uploads: {
		get(): readonly Upload[];
		subscribe(callback: () => void): () => void;
	};
	readonly uploadFiles: (files: readonly File[]) => Promise<void>;
	readonly uploadFile: (file: File, { description, msg }: { description?: string; msg?: string }) => Promise<void>;
	readonly wipeFailedUploads: () => void;
	readonly cancelUpload: (id: Upload['id']) => void;
};
