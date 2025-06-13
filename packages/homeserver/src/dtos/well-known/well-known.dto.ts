import { type Static, t } from 'elysia';

export const WellKnownServerResponseDto = t.Object({
	'm.server': t.String({
		description: 'Matrix server address with port',
		examples: ['matrix.example.com:443']
	}),
}); 

export type WellKnownServerResponse = Static<typeof WellKnownServerResponseDto>;