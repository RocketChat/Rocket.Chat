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
		port: string; // TODO: Check if port should be string
		username: string;
		password: string;
		sslTls: boolean; // TODO: Rename to ssl only
	};
	imap: {
		server: string;
		port: string;
		username: string;
		password: string;
		sslTls: boolean; // TODO: Rename to ssl only
	};
	_createdAt: Date;
	_createdBy: {
		_id: string;
		username: string; // TODO: This will not be updated dynamically
	};
	_updatedAt: Date;
}
