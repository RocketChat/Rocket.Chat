import type { IRocketChatRecord } from './IRocketChatRecord';

export interface IEmailInbox extends IRocketChatRecord {
	active: boolean;
	name: string;
	email: string;
	description?: string;
	senderInfo?: string;
	department?: string;
	smtp: {
		server: string;
		port: number;
		username: string;
		password: string;
		secure: boolean;
	};
	imap: {
		server: string;
		port: number;
		username: string;
		password: string;
		secure: boolean;
		maxRetries: number;
	};
	_createdAt: Date;
	_createdBy: {
		_id: string;
		username?: string;
	} | null;
}

export type IEmailInboxPayload = Omit<IEmailInbox, '_createdAt' | '_createdBy' | '_updatedAt'>;
