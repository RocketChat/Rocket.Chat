import type { ICustomSound } from '../../../core-typings/dist';
import type { PaginatedRequest } from '../helpers/PaginatedRequest';
import type { PaginatedResult } from '../helpers/PaginatedResult';

export type CustomSoundEndpoint = {
	'custom-sounds.list': {
		GET: (params: PaginatedRequest<{ query: string }>) => PaginatedResult<{
			sounds: ICustomSound[];
		}>;
	};
};
