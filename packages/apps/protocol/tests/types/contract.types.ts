/**
 * Type-level tests for the contract builders.
 *
 * Nothing here runs. `yarn typecheck:types` compiles this file under `strict: true`, so a
 * declared `| undefined` must survive into the output type.
 */

import type { IMessage } from '@rocket.chat/apps-engine/definition/messages';
import { z } from 'zod';

import type { ErrorDataOf, ErrorNameOf, InputOf, OutputOf, ParamsOf, PathOf, PathOfKind } from '../../src/rpc/contract';
import { notification, request, shaped, type } from '../../src/rpc/contract';
import { createErrorGuard } from '../../src/rpc/errors';

type Assert<T extends true> = T;
type Equals<A, B> = (<G>() => G extends A ? 1 : 2) extends <G>() => G extends B ? 1 : 2 ? true : false;

export const getById = request({
	input: z.strictObject({ messageId: z.string(), limit: z.number().optional() }),
	output: type<IMessage | undefined>(),
});

export const getRoom = request({
	input: z.strictObject({ roomId: z.string(), limit: z.number().default(10) }),
	output: type<{ id: string }>(),
	errors: { ROOM_NOT_FOUND: type<{ roomId: string }>(), FORBIDDEN: type<void>() },
});

export const log = notification({ input: z.strictObject({ entries: z.array(z.string()) }) });

export const MessageInput = shaped<IMessage>()({ room: z.looseObject({ id: z.string() }) });

export type ARequestKeepsItsKind = Assert<Equals<(typeof getById)['kind'], 'request'>>;

export type ARequestKeepsTheDeclaredOutput = Assert<Equals<OutputOf<typeof getById>, IMessage | undefined>>;

export type ARequestInputIsTheSchemaOutput = Assert<Equals<InputOf<typeof getById>, { messageId: string; limit?: number | undefined }>>;

export type AnInputIsTheParsedValue = Assert<Equals<InputOf<typeof getRoom>, { roomId: string; limit: number }>>;

export type TheParamsAreTheValueBeforeParsing = Assert<Equals<ParamsOf<typeof getRoom>, { roomId: string; limit?: number | undefined }>>;

export type ADeclaredErrorKeepsItsName = Assert<Equals<ErrorNameOf<typeof getRoom>, 'ROOM_NOT_FOUND' | 'FORBIDDEN'>>;

export type ADeclaredErrorKeepsItsData = Assert<Equals<ErrorDataOf<typeof getRoom, 'ROOM_NOT_FOUND'>, { roomId: string }>>;

export type AProcedureWithoutErrorsDeclaresNone = Assert<Equals<ErrorNameOf<typeof getById>, never>>;

export type ANotificationKeepsItsKind = Assert<Equals<(typeof log)['kind'], 'notification'>>;

export type ANotificationOutputIsVoid = Assert<Equals<OutputOf<typeof log>, void>>;

export type AShapedSchemaIsTypedAsTheInterface = Assert<Equals<z.infer<typeof MessageInput>, IMessage>>;

export const contract = { message: { getById, log }, room: { getById: getRoom } };

export type APathIsTheDomainAndTheProcedure = Assert<Equals<PathOf<typeof contract>, 'message.getById' | 'message.log' | 'room.getById'>>;

export type APathOfKindKeepsOnlyThatKind = Assert<Equals<PathOfKind<typeof contract, 'notification'>, 'message.log'>>;

const isProcedureError = createErrorGuard<typeof contract>();

export const narrowsTheData = (error: unknown): string | undefined => {
	if (isProcedureError(error, 'room.getById', 'ROOM_NOT_FOUND')) {
		const { roomId }: { roomId: string } = error.data;

		return roomId;
	}

	return undefined;
};

// @ts-expect-error — `room.getById` declares no `NOT_FOUND`
isProcedureError(new Error(), 'room.getById', 'NOT_FOUND');

// @ts-expect-error — `message.getById` declares no errors
isProcedureError(new Error(), 'message.getById', 'ROOM_NOT_FOUND');

// @ts-expect-error — an error data type is declared with type<T>()
request({ input: z.strictObject({}), output: type<void>(), errors: { ROOM_NOT_FOUND: { roomId: 'x' } } });

// @ts-expect-error — an input is an object schema, not a scalar
request({ input: z.string(), output: type<void>() });

// @ts-expect-error — a request declares its output
request({ input: z.strictObject({}) });

// @ts-expect-error — `rooom` is not a key of `IMessage`
shaped<IMessage>()({ rooom: z.looseObject({ id: z.string() }) });
