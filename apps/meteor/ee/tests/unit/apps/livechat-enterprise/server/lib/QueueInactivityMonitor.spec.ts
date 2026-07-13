import { expect } from 'chai';
import { describe, afterEach, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const cronJobsMock = {
	addAtTimestamp: sinon.stub(),
	remove: sinon.stub(),
	removeByNamePrefix: sinon.stub(),
};

const modelsMock = {
	LivechatRooms: { findOneById: sinon.stub() },
	LivechatInquiry: { findOneById: sinon.stub() },
	Users: { findOneById: sinon.stub() },
};
const livechatMock = { closeRoom: sinon.stub() };
const settingsMock = { settings: { get: sinon.stub() } };

const { OmnichannelQueueInactivityMonitorClass } = proxyquire
	.noCallThru()
	.load('../../../../../../app/livechat-enterprise/server/lib/QueueInactivityMonitor', {
		'@rocket.chat/cron': { cronJobs: cronJobsMock },
		'@rocket.chat/models': modelsMock,
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

	describe('scheduleInquiry', () => {
		beforeEach(() => {
			cronJobsMock.addAtTimestamp.reset();
			cronJobsMock.remove.reset();
		});
		it('should schedule inquiry', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			const now = new Date();
			await qclass.scheduleInquiry('inquiryId', now);

			expect(cronJobsMock.remove.calledOnceWith('Omnichannel-Queue-Inactivity-Monitor-inquiryId')).to.be.true;
			expect(cronJobsMock.remove.calledBefore(cronJobsMock.addAtTimestamp)).to.be.true;
			expect(cronJobsMock.addAtTimestamp.calledOnce).to.be.true;
			expect(cronJobsMock.addAtTimestamp.getCall(0).args[0]).to.be.equal('Omnichannel-Queue-Inactivity-Monitor-inquiryId');
			expect(cronJobsMock.addAtTimestamp.getCall(0).args[1]).to.be.equal(now);
			expect(cronJobsMock.addAtTimestamp.getCall(0).args[2]).to.be.a('function');
		});
	});

	describe('stop', () => {
		beforeEach(() => {
			cronJobsMock.removeByNamePrefix.reset();
		});
		it('should cancel all inquiry jobs by prefix', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			await qclass.stop();
			expect(cronJobsMock.removeByNamePrefix.calledOnceWith('Omnichannel-Queue-Inactivity-Monitor-')).to.be.true;
		});
	});

	describe('stopInquiry', () => {
		beforeEach(() => {
			cronJobsMock.remove.reset();
		});
		it('should cancel inquiry', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			await qclass.stopInquiry('inquiryId');
			expect(cronJobsMock.remove.calledOnceWith('Omnichannel-Queue-Inactivity-Monitor-inquiryId')).to.be.true;
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

			await qclass.closeRoom('inquiryId');
			expect(modelsMock.LivechatInquiry.findOneById.calledWith('inquiryId')).to.be.true;
			expect(livechatMock.closeRoom.notCalled).to.be.true;
		});
		it('should ignore an inquiry with no room', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			modelsMock.LivechatInquiry.findOneById.resolves({ status: 'queued', rid: 'roomId' });
			modelsMock.LivechatRooms.findOneById.resolves(undefined);
			await qclass.closeRoom('inquiryId');

			expect(modelsMock.LivechatInquiry.findOneById.calledWith('inquiryId')).to.be.true;
			expect(modelsMock.LivechatRooms.findOneById.calledWith('roomId')).to.be.true;
			expect(livechatMock.closeRoom.notCalled).to.be.true;
		});
		it('should close a room', async () => {
			const qclass = new OmnichannelQueueInactivityMonitorClass();
			modelsMock.LivechatInquiry.findOneById.resolves({ status: 'queued', rid: 'roomId' });
			modelsMock.LivechatRooms.findOneById.resolves({ _id: 'roomId' });
			modelsMock.Users.findOneById.resolves({ _id: 'rocket.cat' });

			await qclass.closeRoom('inquiryId');

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
