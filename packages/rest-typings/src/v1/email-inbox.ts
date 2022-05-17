import type { IEmailInbox } from '@rocket.chat/core-typings';

import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

export type EmailInboxEndpoints = {
	'email-inbox.list': {
		GET: (params: PaginatedRequest<{ query?: string }>) => PaginatedResult<{ emailInboxes: IEmailInbox[] }>;
	};
	'email-inbox': {
		POST: (params: {
			_id?: string;
			name: string;
			email: string;
			active: boolean;
			description: string;
			senderInfo: string;
			department: string;
			smtp: {
				password: string;
				port: number;
				secure: boolean;
				server: string;
				username: string;
			};
			imap: {
				password: string;
				port: number;
				secure: boolean;
				server: string;
				username: string;
			};
		}) => { _id: string };
	};
	'email-inbox/:_id': {
		GET: (params: void) => IEmailInbox | null;
		DELETE: (params: void) => { _id: string };
	};
	'email-inbox.search': {
		GET: (params: { email: string }) => { emailInbox: IEmailInbox | null };
	};
	'email-inbox.send-test/:_id': {
		POST: (params: void) => { _id: string };
	};
};
