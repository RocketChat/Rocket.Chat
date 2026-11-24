import { strict as assert } from 'node:assert';
import { before, describe, it } from 'node:test';

import type { IRoom, IRoomAbacRedaction } from '@rocket.chat/core-typings';
import { mockModel } from '@rocket.chat/models/testing';
import proxyquire from 'proxyquire';
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

const { isABACManagedRoom } = proxyquire.noCallThru().load('../../../../server/lib/authorization/isABACManagedRoom.ts', {
	'../../settings': { settings: { get: () => true } },
});

proxyquire.noCallThru().load('./scopeAdminRoomsForAbac.ts', {
	'@rocket.chat/core-services': { Abac: { scopeRoomsForAdmin } },
	'@rocket.chat/license': { License: { hasModule: () => true } },
	'../../../../server/api/lib/scopeAdminRoomsForAbac': {
		scopeAdminRoomsForAbac: {
			patch: (fn: Scope) => {
				scope = fn;
			},
		},
	},
	'../../../../server/lib/authorization/isABACManagedRoom': { isABACManagedRoom },
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
