/**
 * Type-level tests for the client half of the RPC machinery.
 *
 * Nothing here runs. `yarn typecheck:types` compiles this file under `strict: true`.
 */

import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { z } from 'zod';

import type { Client, Wire } from '../../src/rpc/client';
import { notification, request, type } from '../../src/rpc/contract';

type Assert<T extends true> = T;
type Equals<A, B> = (<G>() => G extends A ? 1 : 2) extends <G>() => G extends B ? 1 : 2 ? true : false;

export const contract = {
	message: {
		getById: request({ input: z.strictObject({ messageId: z.string() }), output: type<IMessage | undefined>() }),
		list: request({ input: z.strictObject({ limit: z.number().default(10) }), output: type<string[]>() }),
		getAppUser: request({ input: z.strictObject({}), output: type<{ id: string; toString(): string }>() }),
	},
	runtime: {
		log: notification({ input: z.strictObject({ entries: z.array(z.string()) }) }),
	},
};

declare const client: Client<typeof contract>;

export type ARequestResolvesToTheWireOutput = Assert<
	Equals<Awaited<ReturnType<typeof client.request<'message.getById'>>>, Wire<IMessage> | undefined>
>;

export type AWireOutputDropsTheFunctionMembers = Assert<Equals<Wire<{ id: string; toString(): string }>, { id: string }>>;

export type AWireOutputKeepsTheClonedTypes = Assert<
	Equals<Wire<{ at: Date; raw: Uint8Array; tags: Set<string> }>, { at: Date; raw: Uint8Array; tags: Set<string> }>
>;

export type AWireOutputRecursesIntoArrays = Assert<Equals<Wire<{ run(): void; id: string }[]>, { id: string }[]>>;

export type AWireOutputKeepsAny = Assert<Equals<Wire<any>, any>>;

void client.request('message.getById', { messageId: 'm1' });

// The params can be left out when every field is optional.
void client.request('message.list');
void client.request('message.getAppUser');

client.notify('runtime.log', { entries: ['a'] });

// @ts-expect-error — `message.delete` is not a procedure
client.request('message.delete', {});

// @ts-expect-error — `runtime.log` is a notification
client.request('runtime.log', { entries: [] });

// @ts-expect-error — `message.getById` is a request
client.notify('message.getById', { messageId: 'm1' });

// @ts-expect-error — `messageId` is required
client.request('message.getById', {});

// @ts-expect-error — the params of `message.getById` cannot be left out
client.request('message.getById');

// @ts-expect-error — `messageId` is a string
client.request('message.getById', { messageId: 42 });
