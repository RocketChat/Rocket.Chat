import { ICustomSoundSchema } from '@rocket.chat/core-typings';
import * as z from 'zod';

import { SuccessResponseSchema } from './Ajv';
import { PaginatedRequestSchema } from '../helpers/PaginatedRequest';
import { PaginatedResultSchema } from '../helpers/PaginatedResult';

export const GETCustomSoundsListQuerySchema = z
	.object({
		name: z.string().optional(),
	})
	.and(PaginatedRequestSchema);

export const GETCustomSoundsListResponseSchema = SuccessResponseSchema.extend({
	sounds: z.array(ICustomSoundSchema),
}).and(PaginatedResultSchema);
