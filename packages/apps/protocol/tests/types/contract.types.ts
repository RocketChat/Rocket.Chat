/**
 * Type-level tests for the contract builders.
 *
 * Nothing here runs. `yarn typecheck:types` compiles this file under `strict: true`, so a
 * declared `| undefined` must survive into the output type.
 */

import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { z } from 'zod';

import type { InputOf, OutputOf } from '../../src/rpc/contract';
import { notification, request, shaped, type } from '../../src/rpc/contract';

type Assert<T extends true> = T;
type Equals<A, B> = (<G>() => G extends A ? 1 : 2) extends <G>() => G extends B ? 1 : 2 ? true : false;

export const getById = request({
	input: z.strictObject({ messageId: z.string(), limit: z.number().optional() }),
	output: type<IMessage | undefined>(),
});

export const log = notification({ input: z.strictObject({ entries: z.array(z.string()) }) });

export const MessageInput = shaped<IMessage>()({ room: z.looseObject({ id: z.string() }) });

export type ARequestKeepsItsKind = Assert<Equals<(typeof getById)['kind'], 'request'>>;

export type ARequestKeepsTheDeclaredOutput = Assert<Equals<OutputOf<typeof getById>, IMessage | undefined>>;

export type ARequestInputIsTheSchemaOutput = Assert<Equals<InputOf<typeof getById>, { messageId: string; limit?: number | undefined }>>;

export type ANotificationKeepsItsKind = Assert<Equals<(typeof log)['kind'], 'notification'>>;

export type ANotificationOutputIsVoid = Assert<Equals<OutputOf<typeof log>, void>>;

export type AShapedSchemaIsTypedAsTheInterface = Assert<Equals<z.infer<typeof MessageInput>, IMessage>>;

// @ts-expect-error — an input is an object schema, not a scalar
request({ input: z.string(), output: type<void>() });

// @ts-expect-error — a request declares its output
request({ input: z.strictObject({}) });

// @ts-expect-error — `rooom` is not a key of `IMessage`
shaped<IMessage>()({ rooom: z.looseObject({ id: z.string() }) });
