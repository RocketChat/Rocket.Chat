import { type Static, t } from 'elysia';

export const GetVersionsResponseDto = t.Object({
	server: t.Object({
		name: t.String({ description: 'Server software name' }),
		version: t.String({ description: 'Server software version' }),
	}),
});

export type GetVersionsResponse = Static<typeof GetVersionsResponseDto>;