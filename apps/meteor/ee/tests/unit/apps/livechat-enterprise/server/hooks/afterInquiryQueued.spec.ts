import { expect } from 'chai';
import { describe, it } from 'mocha';
import moment from 'moment';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const settingStub = {
	watch: sinon.stub(),
	get: sinon.stub(),
};

const queueMonitorStub = {
	scheduleInquiry: sinon.stub(),
};

const { afterInquiryQueuedFunc: afterInquiryQueued } = proxyquire
	.noCallThru()
	.load('../../../../../../app/livechat-enterprise/server/hooks/afterInquiryQueued.ts', {
		'../../../../../app/settings/server': {
			settings: settingStub,
		},
		'../lib/QueueInactivityMonitor': {
			OmnichannelQueueInactivityMonitor: queueMonitorStub,
		},
		'../../../../../app/livechat/server/lib/hooks': {
			afterInquiryQueued: { patch: sinon.stub() },
		},
	});

describe('hooks/afterInquiryQueued', () => {
	beforeEach(() => {
		queueMonitorStub.scheduleInquiry.resetHistory();
		settingStub.get.resetHistory();
	});

	it('should return undefined if no inquiry is passed, or if inquiry doesnt have valid properties', async () => {
		expect(await afterInquiryQueued(null)).to.be.equal(undefined);
		expect(await afterInquiryQueued({})).to.be.equal(undefined);
		expect(await afterInquiryQueued({ _id: 'invalid' })).to.be.equal(undefined);
		expect(await afterInquiryQueued({ _updatedAt: new Date() }));
		expect(await afterInquiryQueued({ _updatedAt: null, _id: 'afsd34asdX' })).to.be.equal(undefined);
	});

	it('should do nothing if timer is set to 0 or less', async () => {
		const inquiry = {
			_id: 'afsd34asdX',
			_updatedAt: new Date(),
		};

		settingStub.get.returns(0);
		await afterInquiryQueued(inquiry);
		expect(queueMonitorStub.scheduleInquiry.callCount).to.be.equal(0);

		settingStub.get.returns(-1);
		await afterInquiryQueued(inquiry);
		expect(queueMonitorStub.scheduleInquiry.callCount).to.be.equal(0);
	});

	it('should call .scheduleInquiry with proper data', async () => {
		const inquiry = {
			_id: 'afsd34asdX',
			_updatedAt: new Date(),
		};

		settingStub.get.returns(1);
		await afterInquiryQueued(inquiry);

		const newQueueTime = moment(inquiry._updatedAt).add(1, 'minutes');

		expect(queueMonitorStub.scheduleInquiry.calledWith(inquiry._id, new Date(newQueueTime.format()))).to.be.true;
	});

	it('should call .scheduleInquiry with proper data when more than 1 min is passed as param', async () => {
		const inquiry = {
			_id: 'afv34avzx',
			_updatedAt: new Date(),
		};

		settingStub.get.returns(3);
		await afterInquiryQueued(inquiry);

		const newQueueTime = moment(inquiry._updatedAt).add(3, 'minutes');

		expect(queueMonitorStub.scheduleInquiry.calledWith(inquiry._id, new Date(newQueueTime.format()))).to.be.true;
	});
});
