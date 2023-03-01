export interface IEmailInbox {
	_id: string;
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
		username: string;
	};
	_updatedAt: Date;
}

export type IEmailInboxPayload = Omit<IEmailInbox, '_createdAt' | '_createdBy' | '_updatedAt'>;
