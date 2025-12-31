import * as z from 'zod';

export const PaginatedRequestSchema = z.object({
	count: z.number().int().nonnegative().optional(),
	offset: z.number().int().nonnegative().optional(),
	sort: z.string().optional(),
	query: z.string().optional().meta({ deprecated: true }),
});

export type PaginatedRequest<T = Record<string, boolean | number | string | object>, S extends string = string> = {
	count?: number;
	offset?: number;
	sort?: `{ "${S}": ${1 | -1} }` | string;
	/* deprecated */
	query?: string;
} & T;
