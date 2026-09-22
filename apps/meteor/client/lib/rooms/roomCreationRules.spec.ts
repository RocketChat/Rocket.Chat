import type { RoomCreationDraft, RoomCreationPolicy } from './roomCreationRules';
import { resolveRoomCreation } from './roomCreationRules';

const draft = (overrides: Partial<RoomCreationDraft> = {}): RoomCreationDraft => ({
	isPrivate: true,
	encrypted: false,
	broadcast: false,
	readOnly: false,
	federated: false,
	...overrides,
});

const policy = (overrides: Partial<RoomCreationPolicy> = {}): RoomCreationPolicy => ({
	e2eEnabled: true,
	e2eEnforcedForPrivate: false,
	canSetReadOnly: true,
	canUseFederation: true,
	...overrides,
});

describe('resolveRoomCreation', () => {
	describe('a federated room', () => {
		it('is never encrypted, broadcast or read only', () => {
			const { room } = resolveRoomCreation(draft({ federated: true, encrypted: true, broadcast: true, readOnly: true }), policy());

			expect(room).toMatchObject({ encrypted: false, broadcast: false, readOnly: false });
		});

		it('leaves the creator nothing but federation to move', () => {
			const { editable } = resolveRoomCreation(draft({ federated: true }), policy());

			expect(editable).toEqual({ encrypted: false, readOnly: false, broadcast: false, federated: true });
		});

		it('wins over enforced encryption', () => {
			const { room } = resolveRoomCreation(draft({ federated: true, isPrivate: true }), policy({ e2eEnforcedForPrivate: true }));

			expect(room.encrypted).toBe(false);
		});
	});

	describe('encryption', () => {
		it('is off for a public room, whatever the creator picked', () => {
			const { room, editable } = resolveRoomCreation(draft({ isPrivate: false, encrypted: true }), policy());

			expect(room.encrypted).toBe(false);
			expect(editable.encrypted).toBe(false);
		});

		it('is forced on for a private room when the workspace enforces it', () => {
			const { room, editable } = resolveRoomCreation(draft({ isPrivate: true, encrypted: false }), policy({ e2eEnforcedForPrivate: true }));

			expect(room.encrypted).toBe(true);
			expect(editable.encrypted).toBe(false);
		});

		it('is the creator to decide on a private room otherwise', () => {
			const { room, editable } = resolveRoomCreation(draft({ isPrivate: true, encrypted: true }), policy());

			expect(room.encrypted).toBe(true);
			expect(editable.encrypted).toBe(true);
		});

		it('cannot be moved while E2E is off for the workspace', () => {
			const { editable } = resolveRoomCreation(draft({ isPrivate: true }), policy({ e2eEnabled: false }));

			expect(editable.encrypted).toBe(false);
		});
	});

	describe('broadcast', () => {
		it('forces the room read only', () => {
			const { room, editable } = resolveRoomCreation(draft({ broadcast: true, readOnly: false }), policy());

			expect(room.readOnly).toBe(true);
			expect(editable.readOnly).toBe(false);
		});

		it('leaves read only to the creator when it is off', () => {
			const { room, editable } = resolveRoomCreation(draft({ broadcast: false, readOnly: true }), policy());

			expect(room.readOnly).toBe(true);
			expect(editable.readOnly).toBe(true);
		});
	});

	describe('read only', () => {
		it('stays out of reach without the permission', () => {
			const { editable } = resolveRoomCreation(draft(), policy({ canSetReadOnly: false }));

			expect(editable.readOnly).toBe(false);
		});
	});

	describe('federation', () => {
		it('is offered only to a creator the workspace allows it for', () => {
			expect(resolveRoomCreation(draft(), policy({ canUseFederation: false })).editable.federated).toBe(false);
			expect(resolveRoomCreation(draft(), policy({ canUseFederation: true })).editable.federated).toBe(true);
		});
	});

	it('settles in one pass', () => {
		const p = policy({ e2eEnforcedForPrivate: true });
		const once = resolveRoomCreation(draft({ broadcast: true }), p);
		const twice = resolveRoomCreation(once.room, p);

		expect(twice).toEqual(once);
	});
});
