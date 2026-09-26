import type { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const createPrivateGroupMethod = sinon.stub();
const createChannelMethod = sinon.stub();
const createDirectMessage = sinon.stub();
const getSetting = sinon.stub();

const { AppRoomBridge } = proxyquire.noCallThru().load('../../../../../../server/modules/apps/bridges/rooms', {
	'@rocket.chat/apps/dist/server/bridges/RoomBridge': { RoomBridge: class {} },
	'@rocket.chat/models': {
		Users: { findOneById: async (_id: string) => ({ _id, username: 'creator' }) },
	},
	'../../../lib/rooms/addUserToRoom': {},
	'../../../lib/rooms/deleteRoom': {},
	'../../../lib/rooms/removeUserFromRoom': {},
	'../../../meteor-methods/messages/createDirectMessage': { createDirectMessage },
	'../../../meteor-methods/messages/createDiscussion': {},
	'../../../meteor-methods/rooms/createChannel': { createChannelMethod },
	'../../../meteor-methods/rooms/createPrivateGroup': { createPrivateGroupMethod },
	'../../../settings': { settings: { get: getSetting } },
});

const orchestrator = {
	debugLog: () => undefined,
	getConverters: () => ({
		get: () => ({ convertAppRoom: async (room: IRoom) => ({ name: room.slugifiedName }) }),
	}),
};

const abacAttributes = [{ key: 'clearance', values: ['secret'] }];

const buildRoom = (type: RoomType, attributes?: IRoom['abacAttributes']): IRoom =>
	({
		type,
		slugifiedName: 'classified',
		creator: { id: 'creator-id' },
		...(attributes && { abacAttributes: attributes }),
	}) as IRoom;

describe('AppRoomBridge.create', () => {
	let bridge: InstanceType<typeof AppRoomBridge>;

	beforeEach(() => {
		for (const stub of [createPrivateGroupMethod, createChannelMethod, createDirectMessage]) {
			stub.reset();
			stub.resolves({ rid: 'room-id' });
		}
		getSetting.reset();
		getSetting.withArgs('ABAC_Enabled').returns(true);
		bridge = new AppRoomBridge(orchestrator);
	});

	it('passes the ABAC attributes of a private room to the creation guard', async () => {
		expect(await bridge.create(buildRoom(RoomType.PRIVATE_GROUP, abacAttributes), [], 'app-id')).to.equal('room-id');
		expect(createPrivateGroupMethod.firstCall.args[7]).to.deep.equal(abacAttributes);
	});

	it('passes no ABAC attributes when the app supplies an empty list', async () => {
		await bridge.create(buildRoom(RoomType.PRIVATE_GROUP, []), [], 'app-id');

		expect(createPrivateGroupMethod.firstCall.args[7]).to.be.undefined;
	});

	[
		{ shape: 'a string', abacAttributes: 'clearance' },
		{ shape: 'a list holding null', abacAttributes: [null] },
	].forEach(({ shape, abacAttributes: malformed }) => {
		it(`refuses ABAC attributes given as ${shape}`, async () => {
			await expect(bridge.create({ ...buildRoom(RoomType.PRIVATE_GROUP), abacAttributes: malformed }, [], 'app-id')).to.be.rejectedWith(
				'error-abac-invalid-attributes',
			);
			expect(createPrivateGroupMethod.called).to.be.false;
		});
	});

	it('refuses ABAC attributes when ABAC is disabled', async () => {
		getSetting.withArgs('ABAC_Enabled').returns(false);

		await expect(bridge.create(buildRoom(RoomType.PRIVATE_GROUP, abacAttributes), [], 'app-id')).to.be.rejectedWith(
			'error-abac-not-enabled',
		);
		expect(createPrivateGroupMethod.called).to.be.false;
	});

	it('creates a private room without ABAC attributes when ABAC is disabled', async () => {
		getSetting.withArgs('ABAC_Enabled').returns(false);

		expect(await bridge.create(buildRoom(RoomType.PRIVATE_GROUP), [], 'app-id')).to.equal('room-id');
	});

	[RoomType.CHANNEL, RoomType.DIRECT_MESSAGE].forEach((type) => {
		it(`refuses ABAC attributes on a room of type ${type}`, async () => {
			await expect(bridge.create(buildRoom(type, abacAttributes), ['member'], 'app-id')).to.be.rejectedWith(
				'error-abac-attributes-private-rooms-only',
			);
			expect(createChannelMethod.called).to.be.false;
			expect(createDirectMessage.called).to.be.false;
		});
	});
});
