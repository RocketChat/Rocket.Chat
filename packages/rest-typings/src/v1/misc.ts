import type { IUser } from '@rocket.chat/core-typings';

export type MiscEndpoints = {
	'stdout.queue': {
		GET: () => {
			queue: {
				id: string;
				string: string;
				ts: Date;
			}[];
		};
	};

	
	// type DefaultUserFields = {
	// 	[k: string]: number;
	// };
	
	'me': {
		GET: (params: { fields: {[k: string]: number;}, user: IUser }) => {
			me: IUser;
		};
	};

	'shield.svg': {
		GET: (params: { type: string, icon: string, channel: string, name: string, text: string, color: string, size: number }) => {
			svg: string;
		};
	};

	'spotlight': {
		GET: (params: { query: string, limit: number, offset: number }) => {
			results: IUser[];
		};
	};

	'directory': {
		GET: (params: { text: string, type: string, workspace: unknown, sortBy: string | undefined, sortDirection: string, offset: number, limit: number }) => {
			results: IUser[];
		};
	};

	'method.call': {
		POST: (params: { method: string, params: unknown, id: string }) => {
			result: unknown;
		};
	};

	'method.callAnon': {
		POST: (params: { method: string, params: unknown, id: string }) => {
			result: unknown;
		};
	};		
};
