import { IRoom } from '../../IRoom';
import { PaginatedResult } from '../helpers/PaginatedResult';

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
