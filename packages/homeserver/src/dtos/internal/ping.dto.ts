import { type Static, t } from 'elysia';

export const InternalPingResponseDto = t.String({
	description: 'Simple ping response',
	examples: ['PONG!'],
}); 

export type InternalPingResponse = Static<typeof InternalPingResponseDto>;