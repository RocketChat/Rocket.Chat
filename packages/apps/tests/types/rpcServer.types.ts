/**
 * Type-level tests for the RPC server under the host compiler options.
 *
 * Nothing here runs. `yarn typecheck` compiles this file with `strict: false`, which is how the
 * host implements the contract. The checks on the handlers must hold there too.
 */

import { z } from 'zod';

import { request, type } from '../../protocol/src/rpc/contract';
import type { Handlers } from '../../protocol/src/rpc/server';

type Ctx = { appId: string };

export const room = {
	getById: request({ input: z.strictObject({ roomId: z.string() }), output: type<{ id: string }>() }),
	archive: request({ input: z.strictObject({ roomId: z.string() }), output: type<void>() }),
};

export const handlers: Handlers<typeof room, Ctx> = {
	getById: ({ ctx, input }) => ({ id: `${ctx.appId}:${input.roomId}` }),
	archive: async () => undefined,
};

// @ts-expect-error — `archive` has no handler
export const missingHandler: Handlers<typeof room, Ctx> = { getById: () => ({ id: 'r1' }) };

export const wrongOutput: Handlers<typeof room, Ctx> = {
	// @ts-expect-error — the output is `{ id: string }`
	getById: () => ({ id: 42 }),
	archive: async () => undefined,
};

export const wrongInput: Handlers<typeof room, Ctx> = {
	// @ts-expect-error — `roomId` is a string
	getById: ({ input }) => ({ id: input.roomId.toFixed() }),
	archive: async () => undefined,
};
