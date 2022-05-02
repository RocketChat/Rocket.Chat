import type { IRoom } from '@rocket.chat/core-typings';

import type { PaginatedResult } from '../helpers/PaginatedResult';

export type DirectoryEndpoint = {
	directory: {
		GET: (params: {
			query: { [key: string]: string };
			count: number;
			offset: number;
			sort: { [key: string]: number };
		}) => PaginatedResult<{ result: IRoom[] }>;
	};
};
