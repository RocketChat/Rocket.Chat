import { expect } from 'chai';
import sinon from 'sinon';
import { vi } from 'vitest';

const { settingsStub, modelsMock, createDirectMessage, saveRoomSettings, stubs } = vi.hoisted(() => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const sinon = require('sinon');
	return {
		settingsStub: sinon.stub(),
		modelsMock: {
			Rooms: {
				archiveById: sinon.stub(),
				updateOne: sinon.stub(),
				findOneById: sinon.stub(),
				findDirectRoomContainingAllUsernames: sinon.stub(),
				findOneByNonValidatedName: sinon.stub(),
			},
			Subscriptions: {
				archiveByRoomId: sinon.stub(),
			},
		},
		createDirectMessage: sinon.stub(),
		saveRoomSettings: sinon.stub(),
		stubs: {
			notifyOnSubscriptionChangedByRoomId: sinon.stub(),
			createChannelMethod: sinon.stub(),
			createPrivateGroupMethod: sinon.stub(),
		},
	};
});

vi.mock('../../../../../app/settings/server', () => ({ settings: { get: settingsStub } }));
vi.mock('../../../../../server/methods/createDirectMessage', () => ({ createDirectMessage }));
vi.mock('../../../../../app/channel-settings/server/methods/saveRoomSettings', () => ({ saveRoomSettings }));
vi.mock('../../../../../app/lib/server/lib/notifyListener', () => ({
	notifyOnSubscriptionChangedByRoomId: stubs.notifyOnSubscriptionChangedByRoomId,
}));
vi.mock('../../../../../app/lib/server/methods/createChannel', () => ({ createChannelMethod: stubs.createChannelMethod }));
vi.mock('../../../../../app/lib/server/methods/createPrivateGroup', () => ({ createPrivateGroupMethod: stubs.createPrivateGroupMethod }));
vi.mock('@rocket.chat/models', () => modelsMock);

const { RoomConverter } = await import('../../../../../app/importer/server/classes/converters/RoomConverter');

describe('Room Converter', () => {
	beforeEach(() => {
		modelsMock.Rooms.archiveById.reset();
		modelsMock.Rooms.updateOne.reset();
		modelsMock.Rooms.findOneById.reset();
		modelsMock.Rooms.findDirectRoomContainingAllUsernames.reset();
		modelsMock.Rooms.findOneByNonValidatedName.reset();
		modelsMock.Subscriptions.archiveByRoomId.reset();
		createDirectMessage.reset();
		saveRoomSettings.reset();
		settingsStub.reset();
	});

	const roomToImport = {
		name: 'room1',
		importIds: ['importIdRoom1'],
	};

	describe('[findExistingRoom]', () => {
		it('function should be called by the converter', async () => {
			const converter = new RoomConverter({ workInMemory: true });

			sinon.stub(converter, 'findExistingRoom');
			sinon.stub(converter, 'insertOrUpdateRoom');

			await converter.addObject(roomToImport);
			await converter.convertChannels('startedByUserId');

			expect(converter.findExistingRoom.getCall(0)).to.not.be.null;
		});

		it('should search by name', async () => {
			const converter = new RoomConverter({ workInMemory: true });

			await converter.findExistingRoom(roomToImport);
			expect(modelsMock.Rooms.findOneByNonValidatedName.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(modelsMock.Rooms.findOneByNonValidatedName.getCall(0).args).to.be.an('array').that.contains('room1');
		});

		it('should not search by name if there is none', async () => {
			const converter = new RoomConverter({ workInMemory: true });

			await converter.findExistingRoom({});
			expect(modelsMock.Rooms.findOneByNonValidatedName.getCalls()).to.be.an('array').with.lengthOf(0);
		});

		it('should search DMs by usernames', async () => {
			const converter = new RoomConverter({ workInMemory: true });
			converter._cache.addUser('importId1', 'userId1', 'username1');
			converter._cache.addUser('importId2', 'userId2', 'username2');

			await converter.findExistingRoom({
				t: 'd',
				users: ['importId1', 'importId2'],
				importIds: ['importIdRoom1'],
			});

			expect(modelsMock.Rooms.findDirectRoomContainingAllUsernames.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(modelsMock.Rooms.findDirectRoomContainingAllUsernames.getCall(0).args)
				.to.be.an('array')
				.that.deep.includes(['username1', 'username2']);
		});
	});

	describe('[insertRoom]', () => {
		it('function should be called by the converter', async () => {
			const converter = new RoomConverter({ workInMemory: true });

			sinon.stub(converter, 'findExistingRoom');
			sinon.stub(converter, 'insertRoom');
			sinon.stub(converter, 'updateRoom');

			await converter.addObject(roomToImport);
			await converter.convertChannels('startedByUserId');

			expect(converter.updateRoom.getCalls()).to.be.an('array').with.lengthOf(0);
			expect(converter.insertRoom.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(converter.insertRoom.getCall(0).args).to.be.an('array').that.is.not.empty;
			expect(converter.insertRoom.getCall(0).args[0]).to.be.deep.equal(roomToImport);
		});

		it('function should not be called for existing rooms', async () => {
			const converter = new RoomConverter({ workInMemory: true });

			sinon.stub(converter, 'findExistingRoom');
			converter.findExistingRoom.returns({ _id: 'oldId' });
			sinon.stub(converter, 'insertRoom');
			sinon.stub(converter, 'updateRoom');

			await converter.addObject(roomToImport);
			await converter.convertChannels('startedByUserId');

			expect(converter.insertRoom.getCall(0)).to.be.null;
		});

		it('should call createDirectMessage to create DM rooms', async () => {
			const converter = new RoomConverter({ workInMemory: true });
			sinon.stub(converter, 'updateRoomId');

			createDirectMessage.callsFake((_options, data) => {
				return {
					...data,
					_id: 'Id1',
				};
			});

			converter._cache.addUser('importId1', 'userId1', 'username1');
			converter._cache.addUser('importId2', 'userId2', 'username2');

			await (converter as any).insertRoom(
				{
					t: 'd',
					users: ['importId1', 'importId2'],
					importIds: ['importIdRoom1'],
				},
				'startedByUserId',
			);

			expect(createDirectMessage.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(createDirectMessage.getCall(0).args).to.be.an('array').with.lengthOf(3).that.deep.includes(['username1', 'username2']);
		});

		// #TODO: Validate all room types
	});

	describe('callbacks', () => {
		it('beforeImportFn should be triggered', async () => {
			const beforeImportFn = sinon.stub();
			const converter = new RoomConverter({ workInMemory: true });

			sinon.stub(converter, 'findExistingRoom');
			sinon.stub(converter, 'insertOrUpdateRoom');

			await converter.addObject(roomToImport);
			await converter.convertChannels('startedByUserId', {
				beforeImportFn,
			});

			expect(beforeImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
		});

		it('afterImportFn should be triggered', async () => {
			const afterImportFn = sinon.stub();
			const converter = new RoomConverter({ workInMemory: true });

			sinon.stub(converter, 'findExistingRoom');
			sinon.stub(converter, 'insertOrUpdateRoom');

			await converter.addObject(roomToImport);
			await converter.convertChannels('startedByUserId', {
				afterImportFn,
			});

			expect(converter.insertOrUpdateRoom.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(afterImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
		});

		it('should skip record if beforeImportFn returns false', async () => {
			let recordId = null;
			const beforeImportFn = sinon.stub();
			const afterImportFn = sinon.stub();

			beforeImportFn.callsFake((record) => {
				recordId = record._id;
				return false;
			});

			const converter = new RoomConverter({ workInMemory: true });

			sinon.stub(converter, 'findExistingRoom');
			sinon.stub(converter, 'insertOrUpdateRoom');
			sinon.stub(converter, 'skipRecord');

			await converter.addObject(roomToImport);
			await converter.convertChannels('startedByUserId', {
				beforeImportFn,
				afterImportFn,
			});

			expect(beforeImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(afterImportFn.getCalls()).to.be.an('array').with.lengthOf(0);
			expect(converter.skipRecord.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(converter.skipRecord.getCall(0).args).to.be.an('array').that.is.deep.equal([recordId]);
			expect(converter.insertOrUpdateRoom.getCalls()).to.be.an('array').with.lengthOf(0);
		});

		it('should not skip record if beforeImportFn returns true', async () => {
			const beforeImportFn = sinon.stub();
			const afterImportFn = sinon.stub();

			beforeImportFn.callsFake(() => true);

			const converter = new RoomConverter({ workInMemory: true });

			sinon.stub(converter, 'findExistingRoom');
			sinon.stub(converter, 'insertOrUpdateRoom');
			sinon.stub(converter, 'skipRecord');

			await converter.addObject(roomToImport);
			await converter.convertChannels('startedByUserId', {
				beforeImportFn,
				afterImportFn,
			});

			expect(beforeImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(converter.skipRecord.getCalls()).to.be.an('array').with.lengthOf(0);
			expect(converter.insertOrUpdateRoom.getCalls()).to.be.an('array').with.lengthOf(1);
			expect(afterImportFn.getCalls()).to.be.an('array').with.lengthOf(1);
		});

		it('onErrorFn should be triggered if there is no name and is not a DM', async () => {
			const converter = new RoomConverter({ workInMemory: true });

			const onErrorFn = sinon.stub();

			sinon.stub(converter, 'findExistingRoom');
			sinon.stub(converter, 'insertOrUpdateRoom');
			sinon.stub(converter, 'saveError');

			await converter.addObject({});
			await converter.convertChannels('startedByUserId', { onErrorFn });

			expect(converter.insertOrUpdateRoom.getCall(0)).to.be.null;
			expect(onErrorFn.getCall(0)).to.not.be.null;
			expect(converter.saveError.getCall(0)).to.not.be.null;
		});
	});
});
