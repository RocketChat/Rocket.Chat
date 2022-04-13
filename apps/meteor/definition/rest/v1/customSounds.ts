import { PaginatedRequest } from '../helpers/PaginatedRequest';
import { PaginatedResult } from '../helpers/PaginatedResult';

export type CustomSoundEndpoint = {
	'custom-sounds.list': {
		GET: (params: PaginatedRequest<{ query: string }>) => PaginatedResult<{
			sounds: {
				_id: string;
				name: string;
				extension: string;
			}[];
		}>;
	};
};
