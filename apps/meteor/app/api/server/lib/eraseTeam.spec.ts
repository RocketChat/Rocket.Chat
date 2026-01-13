import { expect } from 'chai';
import proxyquireRaw from 'proxyquire';
import * as sinon from 'sinon';

const proxyquire = proxyquireRaw.noCallThru();

type Stubbed = { [k: string]: any };

describe('eraseTeam (TypeScript) module', () => {
	let sandbox: sinon.SinonSandbox;
	let stubs: Stubbed;
	let subject: any;

	beforeEach(() => {
		sandbox = sinon.createSandbox();

		stubs = {
			'Team': {
				getMatchingTeamRooms: sandbox.stub().resolves([]),
				unsetTeamIdOfRooms: sandbox.stub().resolves(),
				removeAllMembersFromTeam: sandbox.stub().resolves(),
				deleteById: sandbox.stub().resolves(),
			},
			'Users': {
				findOneById: sandbox.stub().resolves(null),
			},
			'Rooms': {
				findOneById: sandbox.stub().resolves(null),
			},
			'eraseRoomStub': sandbox.stub().resolves(true),
			'deleteRoomStub': sandbox.stub().resolves(),
			'../../../../server/lib/logger/system': {
				SystemLogger: {
					error: sandbox.stub(),
				},
			},
			'@rocket.chat/apps': {
				AppEvents: {
					IPreRoomDeletePrevent: 'IPreRoomDeletePrevent',
					IPostRoomDeleted: 'IPostRoomDeleted',
				},
				Apps: {
					self: { isLoaded: () => false },
					getBridges: () => ({
						getListenerBridge: () => ({
							roomEvent: sandbox.stub().resolves(false),
						}),
					}),
				},
			},
			'@rocket.chat/models': {
				Rooms: {
					findOneById: (...args: any[]) => stubs.Rooms.findOneById(...args),
				},
				Users: {
					findOneById: (...args: any[]) => stubs.Users.findOneById(...args),
				},
			},
			'@rocket.chat/core-services': {
				MeteorError: (function () {
					class MeteorError extends Error {
						public error: string | undefined;

						public details: any;

						constructor(message?: string, error?: string, details?: any) {
							super(message);
							this.error = error;
							this.details = details;
						}
					}
					return MeteorError;
				})(),
			},
		};

		subject = proxyquire('./eraseTeam', {
			'@rocket.chat/apps': stubs['@rocket.chat/apps'],
			'@rocket.chat/models': stubs['@rocket.chat/models'],
			'../../../../server/lib/eraseRoom': { __esModule: true, eraseRoom: stubs.eraseRoomStub },
			'../../../lib/server/functions/deleteRoom': { __esModule: true, deleteRoom: stubs.deleteRoomStub },
			'../../../../server/lib/logger/system': stubs['../../../../server/lib/logger/system'],
			'@rocket.chat/core-services': {
				MeteorError: stubs['@rocket.chat/core-services'].MeteorError,
				Team: stubs.Team,
			},
		});
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('eraseTeamShared', () => {
		it('throws when user is undefined', async () => {
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			await expect(subject.eraseTeamShared(undefined, { _id: 'team1', roomId: 'teamRoom' }, [], () => {})).to.be.rejected;
		});

		it('erases provided rooms (excluding team.roomId) and cleans up team', async () => {
			const team = { _id: 'team-id', roomId: 'team-room' };
			const user = { _id: 'user-1', username: 'u' };
			stubs.Team.getMatchingTeamRooms.resolves(['room-1', 'room-2', team.roomId]);

			const erased: Array<{ rid: string; user: any }> = [];
			const eraseRoomFn = async (rid: string, user: any) => {
				erased.push({ rid, user });
			};

			await subject.eraseTeamShared(user, team, ['room-1', 'room-2', team.roomId], eraseRoomFn);

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
			const team = { _id: 't1', roomId: 't-room' };
			const user = { _id: 'u1', username: 'u', name: 'User' };
			stubs.Team.getMatchingTeamRooms.resolves([]);
			const { eraseRoomStub } = stubs;
			eraseRoomStub.resolves(true);

			await subject.eraseTeam(user, team, []);

			sinon.assert.calledWith(eraseRoomStub, team.roomId, 'u1');
		});
	});

	describe('eraseTeamOnRelinquishRoomOwnerships', () => {
		it('returns successfully deleted room ids only', async () => {
			const team = { _id: 't1', roomId: 't-room' };
			stubs.Team.getMatchingTeamRooms.resolves(['r1', 'r2']);

			stubs.Rooms.findOneById.withArgs('r1').resolves({ _id: 'r1', federated: false });
			stubs.Rooms.findOneById.withArgs('r2').resolves(null);

			stubs.deleteRoomStub.withArgs('r1').resolves();
			stubs.deleteRoomStub.withArgs('r2').rejects(new Error('boom'));

			const base = proxyquire('./eraseTeam', {
				'@rocket.chat/apps': stubs['@rocket.chat/apps'],
				'@rocket.chat/models': stubs['@rocket.chat/models'],
				'../../../../server/lib/eraseRoom': { __esModule: true, eraseRoom: stubs.eraseRoomStub },
				'../../../lib/server/functions/deleteRoom': { __esModule: true, deleteRoom: stubs.deleteRoomStub },
				'../../../../server/lib/logger/system': stubs['../../../../server/lib/logger/system'],
				'@rocket.chat/core-services': {
					MeteorError: stubs['@rocket.chat/core-services'].MeteorError,
					Team: stubs.Team,
				},
			});

			const result: string[] = await base.eraseTeamOnRelinquishRoomOwnerships(team, ['r1', 'r2']);
			expect(result).to.be.an('array').that.includes('r1').and.not.includes('r2');
		});
	});

	describe('eraseRoomLooseValidation', () => {
		let baseModule: any;

		beforeEach(() => {
			baseModule = proxyquire('./eraseTeam', {
				'@rocket.chat/apps': stubs['@rocket.chat/apps'],
				'@rocket.chat/models': stubs['@rocket.chat/models'],
				'../../../../server/lib/eraseRoom': { __esModule: true, eraseRoom: stubs.eraseRoomStub },
				'../../../lib/server/functions/deleteRoom': { __esModule: true, deleteRoom: stubs.deleteRoomStub },
				'../../../../server/lib/logger/system': stubs['../../../../server/lib/logger/system'],
				'@rocket.chat/core-services': {
					MeteorError: stubs['@rocket.chat/core-services'].MeteorError,
					Team: stubs.Team,
				},
			});
		});

		it('returns false when room not found', async () => {
			stubs.Rooms.findOneById.resolves(null);
			const res = await baseModule.eraseRoomLooseValidation('does-not-exist');
			expect(res).to.be.false;
		});

		it('returns false when room.federated is true', async () => {
			stubs.Rooms.findOneById.resolves({ _id: 'r', federated: true });
			const res = await baseModule.eraseRoomLooseValidation('r');
			expect(res).to.be.false;
		});

		it('returns false when app pre-delete prevents deletion', async () => {
			const listenerStub = sandbox.stub().resolves(true);
			const AppsStub = {
				AppEvents: stubs['@rocket.chat/apps'].AppEvents,
				Apps: {
					self: { isLoaded: () => true },
					getBridges: () => ({ getListenerBridge: () => ({ roomEvent: listenerStub }) }),
				},
			};

			const m = proxyquire('./eraseTeam', {
				'@rocket.chat/apps': AppsStub,
				'@rocket.chat/models': stubs['@rocket.chat/models'],
				'../../../../server/lib/eraseRoom': { __esModule: true, eraseRoom: stubs.eraseRoomStub },
				'../../../lib/server/functions/deleteRoom': { __esModule: true, deleteRoom: stubs.deleteRoomStub },
				'../../../../server/lib/logger/system': stubs['../../../../server/lib/logger/system'],
				'@rocket.chat/core-services': {
					MeteorError: stubs['@rocket.chat/core-services'].MeteorError,
					Team: stubs.Team,
				},
			});

			stubs.Rooms.findOneById.resolves({ _id: 'r', federated: false });

			const res = await m.eraseRoomLooseValidation('r');
			expect(listenerStub.calledOnce).to.be.true;
			expect(res).to.be.false;
		});

		it('logs and returns false when deleteRoom throws', async () => {
			stubs.Rooms.findOneById.resolves({ _id: 'r', federated: false });
			stubs.deleteRoomStub.rejects(new Error('boom'));

			const m = proxyquire('./eraseTeam', {
				'@rocket.chat/apps': stubs['@rocket.chat/apps'],
				'@rocket.chat/models': stubs['@rocket.chat/models'],
				'../../../../server/lib/eraseRoom': { __esModule: true, eraseRoom: stubs.eraseRoomStub },
				'../../../lib/server/functions/deleteRoom': { __esModule: true, deleteRoom: stubs.deleteRoomStub },
				'../../../../server/lib/logger/system': stubs['../../../../server/lib/logger/system'],
				'@rocket.chat/core-services': {
					MeteorError: stubs['@rocket.chat/core-services'].MeteorError,
					Team: stubs.Team,
				},
			});

			const res = await m.eraseRoomLooseValidation('r');
			expect(res).to.be.false;
			sinon.assert.calledOnce(stubs['../../../../server/lib/logger/system'].SystemLogger.error);
		});

		it('calls post-deleted event and returns true on success', async () => {
			const roomEventStub = sandbox.stub().onFirstCall().resolves(false).onSecondCall().resolves();
			const AppsStub = {
				AppEvents: stubs['@rocket.chat/apps'].AppEvents,
				Apps: {
					self: { isLoaded: () => true },
					getBridges: () => ({ getListenerBridge: () => ({ roomEvent: roomEventStub }) }),
				},
			};

			stubs.deleteRoomStub.resolves();
			const m = proxyquire('./eraseTeam', {
				'@rocket.chat/apps': AppsStub,
				'@rocket.chat/models': stubs['@rocket.chat/models'],
				'../../../../server/lib/eraseRoom': { __esModule: true, eraseRoom: stubs.eraseRoomStub },
				'../../../lib/server/functions/deleteRoom': { __esModule: true, deleteRoom: stubs.deleteRoomStub },
				'../../../../server/lib/logger/system': stubs['../../../../server/lib/logger/system'],
				'@rocket.chat/core-services': {
					MeteorError: stubs['@rocket.chat/core-services'].MeteorError,
					Team: stubs.Team,
				},
			});

			stubs.Rooms.findOneById.resolves({ _id: 'r', federated: false });

			const res = await m.eraseRoomLooseValidation('r');
			expect(res).to.be.true;
			sinon.assert.calledTwice(roomEventStub);
		});
	});
});
