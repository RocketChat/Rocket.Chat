import type { IAbacAttributeDefinition } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import type { AbacLockableRoom, RoomAbacLockContext } from './isRoomAbacLocked';
import { isRoomAbacLocked } from './isRoomAbacLocked';

const enforcing = (requiredAttributeKeys: string[] = []): RoomAbacLockContext => ({ enforcementOn: true, requiredAttributeKeys });
const notEnforcing = (requiredAttributeKeys: string[] = []): RoomAbacLockContext => ({ enforcementOn: false, requiredAttributeKeys });

const room = (overrides: Partial<AbacLockableRoom> = {}): AbacLockableRoom => ({ t: 'p', ...overrides });

const attribute = (key: string, values: string[] = ['value']): IAbacAttributeDefinition => ({ key, values });

describe('with enforcement off', () => {
	it('should not lock a room that would otherwise be locked', () => {
		expect(isRoomAbacLocked(room(), notEnforcing())).to.be.false;
	});

	it('should not lock a room missing a required attribute', () => {
		expect(isRoomAbacLocked(room({ abacAttributes: [attribute('clearance')] }), notEnforcing(['nationality']))).to.be.false;
	});
});

describe('room types', () => {
	it('should lock a public channel with no attributes', () => {
		expect(isRoomAbacLocked(room({ t: 'c' }), enforcing())).to.be.true;
	});

	it('should lock a public channel even when it carries every required attribute', () => {
		const context = enforcing(['clearance']);

		expect(isRoomAbacLocked(room({ t: 'c', abacAttributes: [attribute('clearance')] }), context)).to.be.true;
	});

	it('should lock a private channel with no attributes', () => {
		expect(isRoomAbacLocked(room({ t: 'p' }), enforcing())).to.be.true;
	});

	it('should lock a team, which is a channel carrying teamMain', () => {
		expect(isRoomAbacLocked({ ...room({ t: 'p' }), teamMain: true } as AbacLockableRoom, enforcing())).to.be.true;
	});

	it('should lock a pre-existing discussion, which is a channel carrying prid', () => {
		expect(isRoomAbacLocked({ ...room({ t: 'p' }), prid: 'parent' } as AbacLockableRoom, enforcing())).to.be.true;
	});

	it('should never lock a direct message', () => {
		expect(isRoomAbacLocked(room({ t: 'd' }), enforcing(['nationality']))).to.be.false;
	});

	it('should never lock an Omnichannel room', () => {
		expect(isRoomAbacLocked(room({ t: 'l' }), enforcing(['nationality']))).to.be.false;
	});

	it('should never lock a federated room, even a public one', () => {
		expect(isRoomAbacLocked(room({ t: 'c', federated: true }), enforcing(['nationality']))).to.be.false;
	});

	it('should lock a room whose federated flag is explicitly false', () => {
		expect(isRoomAbacLocked(room({ t: 'c', federated: false }), enforcing())).to.be.true;
	});
});

describe('attribute compliance', () => {
	it('should lock a room whose attributes are an empty array', () => {
		expect(isRoomAbacLocked(room({ abacAttributes: [] }), enforcing())).to.be.true;
	});

	it('should not lock a room carrying attributes when nothing is required', () => {
		expect(isRoomAbacLocked(room({ abacAttributes: [attribute('clearance')] }), enforcing())).to.be.false;
	});

	it('should lock a room missing one of the required keys', () => {
		const context = enforcing(['clearance', 'nationality']);

		expect(isRoomAbacLocked(room({ abacAttributes: [attribute('clearance')] }), context)).to.be.true;
	});

	it('should not lock a room carrying every required key', () => {
		const context = enforcing(['clearance', 'nationality']);
		const attributes = [attribute('clearance'), attribute('nationality'), attribute('extra')];

		expect(isRoomAbacLocked(room({ abacAttributes: attributes }), context)).to.be.false;
	});

	it('should lock a room whose required attribute carries no values', () => {
		expect(isRoomAbacLocked(room({ abacAttributes: [attribute('clearance', [])] }), enforcing(['clearance']))).to.be.true;
	});

	it('should compare required keys trimmed', () => {
		expect(isRoomAbacLocked(room({ abacAttributes: [attribute('clearance')] }), enforcing(['  clearance  ']))).to.be.false;
	});

	it('should ignore a required key that is blank', () => {
		expect(isRoomAbacLocked(room({ abacAttributes: [attribute('clearance')] }), enforcing(['   ']))).to.be.false;
	});

	it('should compare keys case-sensitively', () => {
		expect(isRoomAbacLocked(room({ abacAttributes: [attribute('Clearance')] }), enforcing(['clearance']))).to.be.true;
	});
});
