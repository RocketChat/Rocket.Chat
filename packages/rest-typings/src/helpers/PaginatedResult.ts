import * as z from 'zod';

export const PaginatedResultSchema = z.object({
	count: z.number().int().nonnegative().meta({ description: 'The number of items returned in this response.' }),
	offset: z.number().int().nonnegative().meta({ description: 'The number of items that were skipped in this response.' }),
	total: z.number().int().nonnegative().meta({ description: 'The total number of items that match the query.' }),
});

export type PaginatedResult<T = Record<string, boolean | number | string | object>> = {
	count: number;
	offset: number;
	total: number;
} & T;
