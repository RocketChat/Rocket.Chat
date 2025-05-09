import { expect } from 'chai';
import { describe, afterEach, before } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const AgendaJobStub = {
	schedule: sinon.stub(),
	unique: sinon.stub(),
	save: sinon.stub(),
};
const AgendaStub = {
	start: sinon.stub(),
	define: sinon.stub(),
	cancel: sinon.stub(),
	create: sinon.stub().returns(AgendaJobStub),
};

const modelsMock = {
	LivechatRooms: { findOneById: sinon.stub() },
	LivechatInquiry: { findOneById: sinon.stub() },
	Users: { findOneById: sinon.stub() },
};
const meteorMock = { Meteor: { startup: sinon.stub() } };
const createIndexStub = sinon.stub();
const mongoMock = {
	MongoInternals: {
		defaultRemoteCollectionDriver: sinon.stub().returns({
			mongo: { db: { collection: sinon.stub().returns({ createIndex: createIndexStub }) }, client: { db: sinon.stub() } },
		}),
	},
};
const livechatMock = { closeRoom: sinon.stub() };
const settingsMock = { settings: { get: sinon.stub() } };

const { OmnichannelQueueInactivityMonitorClass } = proxyquire
	.noCallThru()
	.load('../../../../../../app/livechat-enterprise/server/lib/QueueInactivityMonitor', {
		'@rocket.chat/agenda': {
			Agenda: sinon.stub().returns(AgendaStub),
		},
		'@rocket.chat/models': modelsMock,
		'meteor/meteor': meteorMock,
		'meteor/mongo': mongoMock,
		'../../../../../app/livechat/server/lib/closeRoom': livechatMock,
		'../../../../../app/settings/server': settingsMock,
		'../../../../../server/lib/i18n': { i18n: { t: sinon.stub().returns('Closed automatically') } },
	});

describe('OmnichannelQueueInactivityMonitorClass', () => {
	afterEach(() => {
		modelsMock.Users.findOneById.reset();
	});
	describe('getRocketChatUser', () => {
		it('should return rocket.cat user', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			await qclass.getRocketCatUser();

			expect(modelsMock.Users.findOneById.calledWith('rocket.cat')).to.be.true;
		});
	});

	describe('getName', () => {
		it('should return valid name', () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			const result = qclass.getName('inquiryId');
			expect(result).to.be.equal('Omnichannel-Queue-Inactivity-Monitor-inquiryId');
		});
	});

	describe('createIndex', () => {
		before(() => {
			createIndexStub.reset();
		});
		it('should create index', () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			qclass.createIndex();
			expect(createIndexStub.calledWith(sinon.match({ 'data.inquiryId': 1 }), sinon.match({ unique: true }))).to.be.true;
		});
	});

	describe('start', () => {
		before(() => {
			AgendaStub.start.reset();
		});
		it('should do nothing if its already running', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			qclass.running = true;
			await qclass.start();
			expect(AgendaStub.start.calledOnce).to.be.false;
		});
		it('should start scheduler', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			await qclass.start();
			expect(AgendaStub.start.calledOnce).to.be.true;
			expect(qclass.running).to.be.true;
		});
	});

	describe('scheduleInquiry', () => {
		beforeEach(() => {
			AgendaStub.define.reset();
		});
		it('should schedule inquiry', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			const now = new Date();
			await qclass.scheduleInquiry('inquiryId', now);

			expect(AgendaStub.cancel.calledOnce).to.be.true;
			expect(AgendaStub.cancel.calledBefore(AgendaStub.define)).to.be.true;
			expect(AgendaStub.define.calledOnce).to.be.true;
			expect(AgendaJobStub.schedule.calledOnceWith(now)).to.be.true;
			expect(AgendaJobStub.unique.calledOnceWith(sinon.match({ 'data.inquiryId': 'inquiryId' }))).to.be.true;
		});
	});

	describe('stop', () => {
		beforeEach(() => {
			AgendaStub.cancel.reset();
		});
		it('should do nothing if process is already stopped', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			qclass.running = false;
			await qclass.stop();
			expect(AgendaStub.cancel.calledOnce).to.be.false;
		});
		it('should not call cancel twice if stop is called twice', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			qclass.running = true;
			await qclass.stop();
			await qclass.stop();
			expect(AgendaStub.cancel.calledOnce).to.be.true;
		});
		it('should cancel all inquiries and flag service as not running', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			qclass.running = true;
			await qclass.stop();
			expect(AgendaStub.cancel.calledOnce).to.be.true;
			expect(qclass.running).to.be.false;
		});
	});

	describe('stopInquiry', () => {
		beforeEach(() => {
			AgendaStub.cancel.reset();
		});
		it('should cancel inquiry', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			await qclass.stopInquiry('inquiryId');
			expect(AgendaStub.cancel.calledOnce).to.be.true;
		});
	});

	describe('closeRoom', () => {
		beforeEach(() => {
			modelsMock.LivechatInquiry.findOneById.reset();
			modelsMock.LivechatRooms.findOneById.reset();
			livechatMock.closeRoom.reset();
		});
		it('should ignore the inquiry if its not in queue anymore', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			modelsMock.LivechatInquiry.findOneById.resolves({ status: 'taken' });

			await qclass.closeRoom({ attrs: { data: { inquiryId: 'inquiryId' } } });
			expect(modelsMock.LivechatInquiry.findOneById.calledWith('inquiryId')).to.be.true;
			expect(livechatMock.closeRoom.notCalled).to.be.true;
		});
		it('should ignore an inquiry with no room', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			modelsMock.LivechatInquiry.findOneById.resolves({ status: 'queued', rid: 'roomId' });
			modelsMock.LivechatRooms.findOneById.resolves(undefined);
			await qclass.closeRoom({ attrs: { data: { inquiryId: 'inquiryId' } } });

			expect(modelsMock.LivechatInquiry.findOneById.calledWith('inquiryId')).to.be.true;
			expect(modelsMock.LivechatRooms.findOneById.calledWith('roomId')).to.be.true;
			expect(livechatMock.closeRoom.notCalled).to.be.true;
		});
		it('should close a room', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			modelsMock.LivechatInquiry.findOneById.resolves({ status: 'queued', rid: 'roomId' });
			modelsMock.LivechatRooms.findOneById.resolves({ _id: 'roomId' });
			modelsMock.Users.findOneById.resolves({ _id: 'rocket.cat' });

			await qclass.closeRoom({ attrs: { data: { inquiryId: 'inquiryId' } } });

			expect(modelsMock.LivechatInquiry.findOneById.calledWith('inquiryId')).to.be.true;
			expect(modelsMock.LivechatRooms.findOneById.calledWith('roomId')).to.be.true;
			expect(
				livechatMock.closeRoom.calledWith(
					sinon.match({
						comment: 'Closed automatically',
						room: { _id: 'roomId' },
						user: { _id: 'rocket.cat' },
					}),
				),
			);
		});
	});
});
