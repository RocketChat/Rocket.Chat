import { strict as assert } from 'node:assert';
import { before, describe, it, mock } from 'node:test';

import type { IRoom, IRoomAbacRedaction } from '@rocket.chat/core-typings';
import { mockModel } from '@rocket.chat/models/testing';
import sinon from 'sinon';

type Room = Pick<IRoom, '_id' | 't' | 'abacAttributes'>;
type Scope = (
	next: (rooms: Room[], uid: string) => Promise<Room[]>,
	rooms: Room[],
	uid: string,
) => Promise<Array<Room & IRoomAbacRedaction>>;

const scopeRoomsForAdmin = sinon.stub();
const findOneById = sinon.stub();
let scope: Scope;

before(async () => {
	mock.module('@rocket.chat/core-services', { exports: { Abac: { scopeRoomsForAdmin } } });
	mock.module('@rocket.chat/license', { exports: { License: { hasModule: () => true } } });
	mock.module('../../../../server/api/lib/scopeAdminRoomsForAbac', {
		exports: {
			scopeAdminRoomsForAbac: {
				patch: (fn: Scope) => {
					scope = fn;
				},
			},
		},
	});
	mock.module('../../../../server/settings', { exports: { settings: { get: () => true } } });
	await import('./scopeAdminRoomsForAbac');
});

describe('scopeAdminRoomsForAbac', () => {
	before(() => {
		mockModel('Users', { findOneById });
	});

	it('redacts managed rooms for an admin without a username', async () => {
		findOneById.resolves({ _id: 'u1' });
		scopeRoomsForAdmin.resetHistory();
		const rooms: Room[] = [
			{ _id: 'managed', t: 'p', abacAttributes: [{ key: 'dept', values: ['eng'] }] },
			{ _id: 'public', t: 'c' },
		];

		const result = await scope(async (original) => original, rooms, 'u1');

		assert.deepEqual(result, [
			{ _id: 'managed', t: 'p', abacAttributes: [], abacAttributesRedacted: true },
			{ _id: 'public', t: 'c' },
		]);
		assert.equal(scopeRoomsForAdmin.called, false);
	});
});
