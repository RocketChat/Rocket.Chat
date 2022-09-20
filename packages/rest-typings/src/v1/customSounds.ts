import type { ICustomSound } from '@rocket.chat/core-typings';

import type { CustomSoundsList, UploadCustomSound } from '..';
import type { PaginatedResult } from '../helpers/PaginatedResult';

export type CustomSoundEndpoint = {
	'/v1/custom-sounds.list': {
		GET: (params: CustomSoundsList) => PaginatedResult<{
			sounds: ICustomSound[];
		}>;
	};

	'/v1/custom-sounds.uploadCustomSound': {
		POST: (params: UploadCustomSound) => void;
	};
};
