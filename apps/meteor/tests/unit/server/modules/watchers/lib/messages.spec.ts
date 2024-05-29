import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

describe('Message Broadcast Tests', () => {
	let getValueByIdStub: sinon.SinonStub;
	let usersFindOneStub: sinon.SinonStub;
	let messagesFindOneStub: sinon.SinonStub;
	let broadcastStub: sinon.SinonStub;
	let getMessageToBroadcast: any;
	let broadcastMessageFromData: any;

	const sampleMessage = {
		_id: '123',
		rid: 'room1',
		msg: 'Hello',
		ts: new Date(),
		u: { _id: 'user1', username: 'user1', name: 'Real User' },
		mentions: [],
		t: 'user-muted',
		_updatedAt: new Date(),
	};

	const modelsStubs = () => ({
		Messages: {
			findOneById: messagesFindOneStub,
		},
		Users: {
			findOne: usersFindOneStub,
		},
		Settings: {
			getValueById: getValueByIdStub,
		},
	});

	const coreStubs = (dbWatchersDisabled: boolean) => ({
		api: {
			broadcast: broadcastStub,
		},
		dbWatchersDisabled,
	});

	const memStubs = (value: (data: string) => any) => (data: string) => value(data);

	beforeEach(() => {
		getValueByIdStub = sinon.stub();
		usersFindOneStub = sinon.stub();
		messagesFindOneStub = sinon.stub();
		broadcastStub = sinon.stub();

		const proxyMock = proxyquire.noCallThru().load('../../../../../../server/modules/watchers/lib/messages', {
			'@rocket.chat/models': modelsStubs(),
			'@rocket.chat/core-services': coreStubs(false),
			'mem': memStubs,
		});

		getMessageToBroadcast = proxyMock.getMessageToBroadcast;
		broadcastMessageFromData = proxyMock.broadcastMessageFromData;
	});

	afterEach(() => {
		sinon.reset();
	});

	describe('getMessageToBroadcast', () => {
		it('should return undefined if message is hidden or imported', async () => {
			messagesFindOneStub.resolves({ ...sampleMessage, _hidden: true });

			const result = await getMessageToBroadcast({ id: '123' });

			expect(result).to.be.undefined;
		});

		it('should hide message if type is in hideSystemMessage settings', async () => {
			messagesFindOneStub.resolves(sampleMessage);
			getValueByIdStub.withArgs('Hide_System_Messages').resolves(['user-muted', 'mute_unmute']);

			const result = await getMessageToBroadcast({ id: '123' });

			expect(result).to.be.undefined;
		});

		it('should return the message with real name if useRealName is true', async () => {
			getValueByIdStub.withArgs('Hide_System_Messages').resolves([]);
			getValueByIdStub.withArgs('UI_Use_Real_Name').resolves(true);
			messagesFindOneStub.resolves(sampleMessage);
			usersFindOneStub.resolves({ name: 'Real User' });

			const result = await getMessageToBroadcast({ id: '123' });

			expect(result).to.have.property('u');
			expect(result?.u).to.have.property('name', 'Real User');
		});
	});

	describe('broadcastMessageFromData', () => {
		const setupProxyMock = (dbWatchersDisabled: boolean) => {
			const proxyMock = proxyquire.noCallThru().load('../../../../../../server/modules/watchers/lib/messages', {
				'@rocket.chat/models': modelsStubs(),
				'@rocket.chat/core-services': coreStubs(dbWatchersDisabled),
				'mem': memStubs,
			});
			broadcastMessageFromData = proxyMock.broadcastMessageFromData;
		};

		const testCases = [
			{
				description: 'should broadcast the message if dbWatchersDisabled is true',
				dbWatchersDisabled: true,
				expectBroadcast: true,
			},
			{
				description: 'should not broadcast the message if dbWatchersDisabled is false',
				dbWatchersDisabled: false,
				expectBroadcast: false,
			},
		];

		testCases.forEach(({ description, dbWatchersDisabled, expectBroadcast }) => {
			it(description, async () => {
				setupProxyMock(dbWatchersDisabled);
				messagesFindOneStub.resolves(sampleMessage);
				getValueByIdStub.resolves([]);

				await broadcastMessageFromData({ id: '123', data: sampleMessage });

				if (expectBroadcast) {
					expect(broadcastStub.calledOnce).to.be.true;
					expect(broadcastStub.calledOnceWith('watch.messages', { message: sampleMessage })).to.be.true;
				} else {
					expect(broadcastStub.called).to.be.false;
				}
			});
		});
	});
});
