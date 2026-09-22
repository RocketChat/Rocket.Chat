/**
 * Type-level tests for the RPC client under the runtime compiler options.
 *
 * Nothing here runs. `yarn typecheck` compiles this file with `strict: false`, which is how
 * `base-runtime` calls the contract. The checks on the paths and the params must hold there too.
 */

import { z } from 'zod';

import type { Client } from '../../protocol/src/rpc/client';
import { request, type } from '../../protocol/src/rpc/contract';

export const contract = {
	message: {
		getById: request({ input: z.strictObject({ messageId: z.string() }), output: type<{ id: string }>() }),
	},
};

declare const client: Client<typeof contract>;

export const resolvesToTheOutput = async (): Promise<string> => (await client.request('message.getById', { messageId: 'm1' })).id;

// @ts-expect-error — `message.delete` is not a procedure
client.request('message.delete', {});

// @ts-expect-error — `messageId` is required
client.request('message.getById', {});

// @ts-expect-error — `messageId` is a string
client.request('message.getById', { messageId: 42 });
