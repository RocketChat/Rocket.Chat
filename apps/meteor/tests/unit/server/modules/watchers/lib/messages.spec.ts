import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const getValueByIdStub = sinon.stub();
const usersFindOneStub = sinon.stub();
const messagesFindOneStub = sinon.stub();
const broadcastStub = sinon.stub();

const modelsStubs = {
	Messages: {
		findOneById: messagesFindOneStub,
	},
	Users: {
		findOne: usersFindOneStub,
	},
	Settings: {
		getValueById: getValueByIdStub,
	},
};

const coreStubs = (dbWatchersDisabled: boolean) => ({
	api: {
		broadcast: broadcastStub,
	},
	dbWatchersDisabled,
});

const memStubs = (value: (data: string) => any) => (data: string) => value(data);

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

describe('getMessageToBroadcast', () => {
	let originalEnv: NodeJS.ProcessEnv;
	let getMessageToBroadcast: any;

	beforeEach(() => {
		originalEnv = { ...process.env };
		const proxyMock = proxyquire.noCallThru().load('../../../../../../server/modules/watchers/lib/messages', {
			'@rocket.chat/models': modelsStubs,
			'@rocket.chat/core-services': coreStubs(false),
			'mem': memStubs,
		});
		getMessageToBroadcast = proxyMock.getMessageToBroadcast;
	});

	afterEach(() => {
		process.env = originalEnv;
		sinon.reset();
	});

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
	let broadcastMessageFromData: any;

	const setupProxyMock = (dbWatchersDisabled: boolean) => {
		const proxyMock = proxyquire.noCallThru().load('../../../../../../server/modules/watchers/lib/messages', {
			'@rocket.chat/models': modelsStubs,
			'@rocket.chat/core-services': coreStubs(dbWatchersDisabled),
			'mem': memStubs,
		});
		broadcastMessageFromData = proxyMock.broadcastMessageFromData;
	};

	afterEach(() => {
		sinon.reset();
	});

	it('should broadcast the message if dbWatchersDisabled is true', async () => {
		setupProxyMock(true);
		messagesFindOneStub.resolves(sampleMessage);
		getValueByIdStub.resolves([]);

		await broadcastMessageFromData({ id: '123', data: sampleMessage });

		expect(broadcastStub.calledOnce).to.be.true;
		expect(broadcastStub.calledOnceWith('watch.messages', { message: sampleMessage })).to.be.true;
	});

	it('should not broadcast the message if dbWatchersDisabled is false', async () => {
		setupProxyMock(false);
		messagesFindOneStub.resolves(sampleMessage);
		getValueByIdStub.resolves([]);

		await broadcastMessageFromData({ id: '123', data: sampleMessage });

		expect(broadcastStub.called).to.be.false;
	});
});
