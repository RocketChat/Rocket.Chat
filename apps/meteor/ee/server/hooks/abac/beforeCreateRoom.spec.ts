import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import p from 'proxyquire';
import sinon from 'sinon';

type RoomToCreate = Omit<IRoom, '_id' | '_updatedAt'>;
type Guard = (data: { owner: IUser; room: RoomToCreate; members: string[] }) => Promise<void>;

const settingsMock = { get: sinon.stub() };
const licenseMock = { hasModule: sinon.stub() };
const getRoomAbacLockContextMock = sinon.stub();
const hasPermissionAsyncMock = sinon.stub();
const validateCreationAttributesMock = sinon.stub();

let guard: Guard;

p.noCallThru().load('../../../../../../ee/server/hooks/abac/beforeCreateRoom.ts', {
	'@rocket.chat/core-services': { Abac: { validateCreationAttributes: validateCreationAttributesMock } },
	'@rocket.chat/license': { License: licenseMock },
	'../../../../server/lib/authorization/getRoomAbacLockContext': { getRoomAbacLockContext: getRoomAbacLockContextMock },
	'../../../../server/lib/authorization/hasPermission': { hasPermissionAsync: hasPermissionAsyncMock },
	'../../../../server/lib/callbacks': { callbacks: { priority: { HIGH: 1 } } },
	'../../../../server/lib/callbacks/beforeCreateRoomCallback': {
		beforeCreateRoomCallback: {
			add: (fn: Guard) => {
				guard = fn;
			},
		},
	},
	'../../../../server/settings': { settings: settingsMock },
});

const owner = { _id: 'owner', username: 'owner', name: 'Owner' } as IUser;

const privateRoom = (extra: Partial<RoomToCreate> = {}): RoomToCreate => ({ t: 'p', name: 'room', ...extra }) as RoomToCreate;

const run = (room: RoomToCreate, members: string[] = ['owner']) => guard({ owner, room, members });

const enforcement = (requiredAttributeKeys: string[] = []) =>
	getRoomAbacLockContextMock.returns({ enforcementOn: true, requiredAttributeKeys });

describe('beforeCreateRoom (ABAC)', () => {
	beforeEach(() => {
		settingsMock.get.reset();
		licenseMock.hasModule.reset();
		getRoomAbacLockContextMock.reset();
		hasPermissionAsyncMock.reset();
		validateCreationAttributesMock.reset();

		settingsMock.get.withArgs('ABAC_Enabled').returns(true);
		licenseMock.hasModule.withArgs('abac').returns(true);
		getRoomAbacLockContextMock.returns({ enforcementOn: false, requiredAttributeKeys: [] });
		hasPermissionAsyncMock.resolves(true);
		validateCreationAttributesMock.callsFake(async (attributes) => ({ allowed: true, attributes, bypassed: false }));
	});

	describe('a room created with attributes', () => {
		const abacAttributes = [{ key: 'dept', values: ['eng'] }];

		it('should be refused while ABAC is disabled', async () => {
			settingsMock.get.withArgs('ABAC_Enabled').returns(false);

			await expect(run(privateRoom({ abacAttributes }))).to.be.rejectedWith('error-abac-not-enabled');
		});

		it('should be refused without the abac license module', async () => {
			licenseMock.hasModule.withArgs('abac').returns(false);

			await expect(run(privateRoom({ abacAttributes }))).to.be.rejectedWith('error-abac-not-enabled');
			expect(validateCreationAttributesMock.called).to.be.false;
		});

		it('should be refused when federated, whether or not enforcement is on', async () => {
			await expect(run(privateRoom({ abacAttributes, federated: true }))).to.be.rejectedWith('error-abac-federated-room-attributes');
		});

		it('should be refused unless it is a private room', async () => {
			await expect(run(privateRoom({ abacAttributes, t: 'c' }))).to.be.rejectedWith('error-abac-attributes-private-rooms-only');
			await expect(run(privateRoom({ abacAttributes, prid: 'parent' }))).to.be.rejectedWith('error-abac-attributes-private-rooms-only');
		});

		it('should be refused to a creator without the permission, before the PDP is asked', async () => {
			hasPermissionAsyncMock.withArgs('owner', 'create-abac-managed-room').resolves(false);

			await expect(run(privateRoom({ abacAttributes }))).to.be.rejectedWith('error-abac-attributes-not-allowed');
			expect(validateCreationAttributesMock.called).to.be.false;
		});

		it('should name the attribute the creator may not assign', async () => {
			validateCreationAttributesMock.resolves({
				allowed: false,
				reason: 'not-entitled',
				code: 'error-invalid-attribute-values',
				attributes: [{ key: 'dept', values: ['eng'] }],
			});

			const error = await run(privateRoom({ abacAttributes })).catch((err) => err);

			expect(error).to.include({ error: 'error-abac-attribute-not-assignable' });
			expect(error.details).to.deep.equal({
				cause: 'error-invalid-attribute-values',
				attributes: [{ key: 'dept', values: ['eng'] }],
			});
		});

		it('should say decisions are unavailable, not that the creator lacks anything, when the PDP is down', async () => {
			validateCreationAttributesMock.resolves({ allowed: false, reason: 'unavailable', code: 'error-pdp-unavailable' });

			await expect(run(privateRoom({ abacAttributes }))).to.be.rejectedWith('error-abac-decision-unavailable');
		});

		it('should insert the attributes as the PDP normalized them', async () => {
			validateCreationAttributesMock.resolves({ allowed: true, attributes: [{ key: 'dept', values: ['eng'] }], bypassed: false });
			const room = privateRoom({ abacAttributes: [{ key: ' dept ', values: ['eng', 'eng'] }] });

			await run(room);

			expect(room.abacAttributes).to.deep.equal([{ key: 'dept', values: ['eng'] }]);
			expect(validateCreationAttributesMock.calledWith(sinon.match.any, { _id: 'owner', username: 'owner', name: 'Owner' })).to.be.true;
		});

		it('should have the PDP admit a creator who joins the room', async () => {
			await run(privateRoom({ abacAttributes }), ['owner', 'member']);

			expect(validateCreationAttributesMock.firstCall.args[2]).to.deep.equal({ creatorJoins: true });
		});

		it('should not have the PDP admit a creator who excluded themselves', async () => {
			await run(privateRoom({ abacAttributes }), ['member']);

			expect(validateCreationAttributesMock.firstCall.args[2]).to.deep.equal({ creatorJoins: false });
		});

		it('should refuse a creator the PDP would not admit to the room', async () => {
			validateCreationAttributesMock.resolves({
				allowed: false,
				reason: 'creator-not-admitted',
				code: 'error-only-compliant-users-can-be-added-to-abac-rooms',
			});

			await expect(run(privateRoom({ abacAttributes }))).to.be.rejectedWith('error-abac-creator-not-admitted');
		});
	});

	describe('under enforcement', () => {
		beforeEach(() => enforcement(['clearance']));

		it('should refuse a private room that would be born locked', async () => {
			await expect(run(privateRoom())).to.be.rejectedWith('error-abac-attributes-required');
		});

		it('should refuse a private room missing a required attribute', async () => {
			await expect(run(privateRoom({ abacAttributes: [{ key: 'dept', values: ['eng'] }] }))).to.be.rejectedWith(
				'error-abac-attributes-required',
			);
		});

		it('should admit a private room carrying every required attribute', async () => {
			await expect(run(privateRoom({ abacAttributes: [{ key: 'clearance', values: ['secret'] }] }))).to.be.fulfilled;
		});

		it('should refuse a federated room', async () => {
			await expect(run(privateRoom({ federated: true }))).to.be.rejectedWith('error-abac-federated-room-creation-blocked');
		});

		it('should refuse public channels and discussions', async () => {
			await expect(run(privateRoom({ t: 'c' }))).to.be.rejectedWith('error-abac-public-room-creation-blocked');
			await expect(run(privateRoom({ prid: 'parent' }))).to.be.rejectedWith('error-abac-discussion-creation-blocked');
		});

		it('should leave omnichannel rooms alone', async () => {
			await expect(run(privateRoom({ t: 'l' }))).to.be.fulfilled;
		});
	});

	it('should leave a room without attributes alone while enforcement is off', async () => {
		await expect(run(privateRoom())).to.be.fulfilled;
		expect(validateCreationAttributesMock.called).to.be.false;
	});
});
