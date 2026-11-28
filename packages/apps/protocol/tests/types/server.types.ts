/**
 * Type-level tests for the server half of the RPC machinery.
 *
 * Nothing here runs. `yarn typecheck:types` compiles this file under `strict: true`.
 */

import { z } from 'zod';

import { notification, request, type } from '../../src/rpc/contract';
import type { Handlers, Middleware } from '../../src/rpc/server';
import { implement, use } from '../../src/rpc/server';

type Ctx = { appId: string; isRestarting(): boolean };

export const contract = {
	room: {
		getById: request({
			input: z.strictObject({ roomId: z.string() }),
			output: type<{ id: string } | undefined>(),
			errors: { ROOM_NOT_FOUND: type<{ roomId: string }>() },
		}),
		archive: request({ input: z.strictObject({ roomId: z.string() }), output: type<void>() }),
	},
	runtime: {
		log: notification({ input: z.strictObject({ entries: z.array(z.string()) }) }),
	},
};

const skipWhileRestarting: Middleware<Ctx> = ({ ctx, next }) => (ctx.isRestarting() ? undefined : next());

export const roomHandlers: Handlers<(typeof contract)['room'], Ctx> = {
	getById: ({ input, errors }) => {
		const { roomId }: { roomId: string } = input;

		if (roomId === 'missing') {
			throw errors.ROOM_NOT_FOUND({ roomId });
		}

		return { id: roomId };
	},
	// The handler keeps its contextual type through `use`.
	archive: use(skipWhileRestarting, async ({ ctx, input }) => {
		const { appId }: { appId: string } = ctx;
		const { roomId }: { roomId: string } = input;

		void appId;
		void roomId;
	}),
};

export const runtimeHandlers: Handlers<(typeof contract)['runtime'], Ctx> = use(skipWhileRestarting, {
	log: ({ input }) => {
		const { entries }: { entries: string[] } = input;

		void entries;
	},
});

export const implementation = implement(contract, { room: roomHandlers, runtime: runtimeHandlers }, { use: [skipWhileRestarting] });

export const callsWithTheContext = (ctx: Ctx) => implementation.call('room.getById', { roomId: 'r1' }, ctx);

// @ts-expect-error — the context is not the one the handlers take
implementation.call('room.getById', {}, { appId: 'app1' });

// @ts-expect-error — `archive` has no handler
export const missingHandler: Handlers<(typeof contract)['room'], Ctx> = { getById: () => undefined };

export const extraHandler: Handlers<(typeof contract)['room'], Ctx> = {
	getById: () => undefined,
	archive: () => undefined,
	// @ts-expect-error — `delete` is not a procedure of `room`
	delete: () => undefined,
};

export const wrongOutput: Handlers<(typeof contract)['room'], Ctx> = {
	// @ts-expect-error — the output is `{ id: string } | undefined`
	getById: () => ({ id: 42 }),
	archive: () => undefined,
};

export const undeclaredError: Handlers<(typeof contract)['room'], Ctx> = {
	getById: ({ errors }) => {
		// @ts-expect-error — `room.getById` declares no `FORBIDDEN`
		throw errors.FORBIDDEN({});
	},
	archive: ({ errors }) => {
		// @ts-expect-error — `room.archive` declares no errors
		throw errors.ROOM_NOT_FOUND({ roomId: 'r1' });
	},
};

export const wrongErrorData: Handlers<(typeof contract)['room'], Ctx> = {
	getById: ({ errors }) => {
		// @ts-expect-error — the data of `ROOM_NOT_FOUND` is `{ roomId: string }`
		throw errors.ROOM_NOT_FOUND({ room: 'r1' });
	},
	archive: () => undefined,
};

// @ts-expect-error — the `runtime` domain has no handlers
implement(contract, { room: roomHandlers });
