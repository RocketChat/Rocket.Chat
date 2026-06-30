import { expect } from 'chai';
import sinon from 'sinon';
import { beforeEach, describe, it, vi } from 'vitest';

// Previously this file re-`proxyquire`d './eraseTeam' inside individual tests purely to vary the
// `Apps` mock. With `vi.mock` + mutable sinon stubs we mock each dependency ONCE and reconfigure
// the stubs per test (no module reloading needed). Stubs are built in `vi.hoisted` so the mock
// factories (which are hoisted above imports) can reference them.
const { stubs, MeteorError, sandbox } = vi.hoisted(() => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const sinon = require('sinon');
	// IMPORTANT: stubs are created with the sinon instance available at hoist time. Reset them
	// through this same sandbox in beforeEach — calling the top-level `sinon.reset()` would target
	// a different module instance and leak call history across tests.
	const sandbox = sinon.createSandbox();

	class MeteorError extends Error {
		public error: string | undefined;

		public details: any;

		constructor(message?: string, error?: string, details?: any) {
			super(message);
			this.error = error;
			this.details = details;
		}
	}

	return {
		MeteorError,
		sandbox,
		stubs: {
			Team: {
				getMatchingTeamRooms: sandbox.stub(),
				unsetTeamIdOfRooms: sandbox.stub(),
				removeAllMembersFromTeam: sandbox.stub(),
				deleteById: sandbox.stub(),
			},
			Users: { findOneById: sandbox.stub() },
			Rooms: { findOneById: sandbox.stub() },
			eraseRoom: sandbox.stub(),
			deleteRoom: sandbox.stub(),
			SystemLogger: { error: sandbox.stub() },
			Apps: {
				self: {
					isLoaded: sandbox.stub(),
					triggerEvent: sandbox.stub(),
				},
			},
			AppEvents: {
				IPreRoomDeletePrevent: 'IPreRoomDeletePrevent',
				IPostRoomDeleted: 'IPostRoomDeleted',
			},
		},
	};
});

vi.mock('@rocket.chat/apps', () => ({ Apps: stubs.Apps, AppEvents: stubs.AppEvents }));
vi.mock('@rocket.chat/core-services', () => ({ MeteorError, Team: stubs.Team }));
vi.mock('@rocket.chat/models', () => ({ Rooms: stubs.Rooms, Users: stubs.Users }));
vi.mock('../../../../server/lib/eraseRoom', () => ({ eraseRoom: stubs.eraseRoom }));
vi.mock('../../../lib/server/functions/deleteRoom', () => ({ deleteRoom: stubs.deleteRoom }));
vi.mock('../../../../server/lib/logger/system', () => ({ SystemLogger: stubs.SystemLogger }));

const { eraseTeam, eraseTeamShared, eraseTeamOnRelinquishRoomOwnerships, eraseRoomLooseValidation } = await import('./eraseTeam');

describe('eraseTeam (TypeScript) module', () => {
	beforeEach(() => {
		sandbox.reset();
		// default behaviours
		stubs.Team.getMatchingTeamRooms.resolves([]);
		stubs.Team.unsetTeamIdOfRooms.resolves();
		stubs.Team.removeAllMembersFromTeam.resolves();
		stubs.Team.deleteById.resolves();
		stubs.Users.findOneById.resolves(null);
		stubs.Rooms.findOneById.resolves(null);
		stubs.eraseRoom.resolves(true);
		stubs.deleteRoom.resolves();
		stubs.Apps.self.isLoaded.returns(false);
		stubs.Apps.self.triggerEvent.resolves(false);
	});

	describe('eraseTeamShared', () => {
		it('throws when user is undefined', async () => {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			await expect(eraseTeamShared(undefined as any, { _id: 'team1', roomId: 'teamRoom' } as any, [], () => {})).to.be.rejected;
		});

		it('erases provided rooms (excluding team.roomId) and cleans up team', async () => {
			const team = { _id: 'team-id', roomId: 'team-room' } as any;
			const user = { _id: 'user-1', username: 'u' } as any;
			stubs.Team.getMatchingTeamRooms.resolves(['room-1', 'room-2', team.roomId]);

			const erased: Array<{ rid: string; user: any }> = [];
			const eraseRoomFn = async (rid: string, user: any) => {
				erased.push({ rid, user });
			};

			await eraseTeamShared(user, team, ['room-1', 'room-2', team.roomId], eraseRoomFn);

			expect(erased.some((r) => r.rid === 'room-1')).to.be.true;
			expect(erased.some((r) => r.rid === 'room-2')).to.be.true;
			sinon.assert.calledOnce(stubs.Team.unsetTeamIdOfRooms);
			expect(erased.some((r) => r.rid === team.roomId)).to.be.true;
			sinon.assert.calledOnce(stubs.Team.removeAllMembersFromTeam);
			sinon.assert.calledOnce(stubs.Team.deleteById);
		});
	});

	describe('eraseTeam', () => {
		it('calls eraseRoom for the team main room (via eraseTeamShared)', async () => {
			const team = { _id: 't1', roomId: 't-room' } as any;
			const user = { _id: 'u1', username: 'u', name: 'User' } as any;
			stubs.Team.getMatchingTeamRooms.resolves([]);
			stubs.eraseRoom.resolves(true);

			await eraseTeam(user, team, []);

			sinon.assert.calledWith(stubs.eraseRoom, team.roomId, user);
		});
	});

	describe('eraseTeamOnRelinquishRoomOwnerships', () => {
		it('returns successfully deleted room ids only', async () => {
			const team = { _id: 't1', roomId: 't-room' } as any;
			stubs.Team.getMatchingTeamRooms.resolves(['r1', 'r2']);

			stubs.Rooms.findOneById.withArgs('r1').resolves({ _id: 'r1', federated: false });
			stubs.Rooms.findOneById.withArgs('r2').resolves(null);

			stubs.deleteRoom.withArgs('r1').resolves();
			stubs.deleteRoom.withArgs('r2').rejects(new Error('boom'));

			const result: string[] = await eraseTeamOnRelinquishRoomOwnerships(team, ['r1', 'r2']);
			expect(result).to.be.an('array').that.includes('r1').and.not.includes('r2');
		});
	});

	describe('eraseRoomLooseValidation', () => {
		it('returns false when room not found', async () => {
			stubs.Rooms.findOneById.resolves(null);
			const res = await eraseRoomLooseValidation('does-not-exist');
			expect(res).to.be.false;
		});

		it('returns false when room.federated is true', async () => {
			stubs.Rooms.findOneById.resolves({ _id: 'r', federated: true });
			const res = await eraseRoomLooseValidation('r');
			expect(res).to.be.false;
		});

		it('returns false when app pre-delete prevents deletion', async () => {
			stubs.Apps.self.isLoaded.returns(true);
			stubs.Apps.self.triggerEvent.resolves(true);
			stubs.Rooms.findOneById.resolves({ _id: 'r', federated: false });

			const res = await eraseRoomLooseValidation('r');
			expect(stubs.Apps.self.triggerEvent.calledOnce).to.be.true;
			expect(res).to.be.false;
		});

		it('logs and returns false when deleteRoom throws', async () => {
			stubs.Rooms.findOneById.resolves({ _id: 'r', federated: false });
			stubs.deleteRoom.rejects(new Error('boom'));

			const res = await eraseRoomLooseValidation('r');
			expect(res).to.be.false;
			sinon.assert.calledOnce(stubs.SystemLogger.error);
		});

		it('calls post-deleted event and returns true on success', async () => {
			stubs.Apps.self.isLoaded.returns(true);
			stubs.Apps.self.triggerEvent.onFirstCall().resolves(false).onSecondCall().resolves();
			stubs.deleteRoom.resolves();
			stubs.Rooms.findOneById.resolves({ _id: 'r', federated: false });

			const res = await eraseRoomLooseValidation('r');
			expect(res).to.be.true;
			sinon.assert.calledTwice(stubs.Apps.self.triggerEvent);
		});
	});
});
