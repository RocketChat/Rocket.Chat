import * as z from 'zod';

export const PaginatedRequestSchema = z.object({
	count: z
		.codec(z.string(), z.number().int().nonnegative(), {
			decode: (val) => parseInt(val, 10),
			encode: (val) => val.toString(),
		})
		.optional(),
	offset: z
		.codec(z.string(), z.number().int().nonnegative(), {
			decode: (val) => parseInt(val, 10),
			encode: (val) => val.toString(),
		})
		.optional(),
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
