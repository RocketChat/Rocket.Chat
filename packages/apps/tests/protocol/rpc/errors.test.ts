import * as assert from 'node:assert';
import { describe, it } from 'node:test';

import type { Input, Output, Procedure } from '../../../protocol/src/rpc/contract';
import { ProcedureError, createErrorGuard } from '../../../protocol/src/rpc/errors';

describe('ProcedureError', () => {
	it('is an Error named after the declared error', () => {
		const error = new ProcedureError('room.getById', 'ROOM_NOT_FOUND', { roomId: 'GENERAL' });

		assert.ok(error instanceof Error);
		assert.strictEqual(error.name, 'ROOM_NOT_FOUND');
		assert.strictEqual(error.path, 'room.getById');
		assert.deepStrictEqual(error.data, { roomId: 'GENERAL' });
	});
});

describe('createErrorGuard', () => {
	type GetById = Procedure<'request', Input, void, { ROOM_NOT_FOUND: Output<{ roomId: string }>; FORBIDDEN: Output<void> }>;

	const isProcedureError = createErrorGuard<{ room: { getById: GetById } }>();

	it('matches the error of the given path and name', () => {
		assert.strictEqual(isProcedureError(new ProcedureError('room.getById', 'ROOM_NOT_FOUND', {}), 'room.getById', 'ROOM_NOT_FOUND'), true);
	});

	it('rejects the same path with another name', () => {
		assert.strictEqual(
			isProcedureError(new ProcedureError('room.getById', 'FORBIDDEN', undefined), 'room.getById', 'ROOM_NOT_FOUND'),
			false,
		);
	});

	it('rejects the same name from another path', () => {
		assert.strictEqual(isProcedureError(new ProcedureError('room.create', 'ROOM_NOT_FOUND', {}), 'room.getById', 'ROOM_NOT_FOUND'), false);
	});

	it('rejects a plain object of the same shape', () => {
		const lookalike = { name: 'ROOM_NOT_FOUND', path: 'room.getById', data: {} };

		assert.strictEqual(isProcedureError(lookalike, 'room.getById', 'ROOM_NOT_FOUND'), false);
	});
});
