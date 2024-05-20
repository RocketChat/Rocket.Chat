import { expect } from 'chai';
import { describe, it } from 'mocha';
import moment from 'moment';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const settingStub = {
	watch: sinon.stub(),
};

const callbackStub = {
	add: sinon.stub(),
	remove: sinon.stub(),
	priority: { HIGH: 'high' },
};

const queueMonitorStub = {
	scheduleInquiry: sinon.stub(),
};

const { withTimer } = proxyquire.noCallThru().load('../../../../../../app/livechat-enterprise/server/hooks/afterInquiryQueued.ts', {
	'../../../../../app/settings/server': {
		settings: settingStub,
	},
	'../../../../../lib/callbacks': {
		callbacks: callbackStub,
	},
	'../lib/QueueInactivityMonitor': {
		OmnichannelQueueInactivityMonitor: queueMonitorStub,
	},
	'../lib/logger': {
		cbLogger: { debug: sinon.stub() },
	},
});

describe('hooks/afterInquiryQueued', () => {
	beforeEach(() => {
		callbackStub.add.resetHistory();
		callbackStub.remove.resetHistory();
		queueMonitorStub.scheduleInquiry.resetHistory();
	});

	it('should call settings.watch at first', () => {
		expect(settingStub.watch.callCount).to.be.equal(1);
	});

	it('should call the callback on settings.watch with proper values', () => {
		const func = settingStub.watch.getCall(0).args[1];

		func(1);
		expect(callbackStub.add.callCount).to.be.equal(1);

		func(0);
		expect(callbackStub.remove.callCount).to.be.equal(1);

		func(-1);
		expect(callbackStub.remove.callCount).to.be.equal(2);
	});

	it('withTimer should return a function', () => {
		expect(typeof withTimer(1)).to.be.equal('function');
	});

	it('returned function should fail if no inquiry is passed, or if inquiry doesnt have valid properties', async () => {
		const func = withTimer(1);
		expect(await func(null)).to.be.equal(undefined);
		expect(await func({})).to.be.equal(undefined);
		expect(await func({ _id: 'invalid' })).to.be.equal(undefined);
		expect(await func({ _updatedAt: null, _id: 'afsd34asdX' })).to.be.equal(undefined);
	});

	it('should call .scheduleInquiry with proper data', async () => {
		const func = withTimer(1);

		const inquiry = {
			_id: 'afsd34asdX',
			_updatedAt: new Date(),
		};

		await func(inquiry);

		const newQueueTime = moment(inquiry._updatedAt).add(1, 'minutes');

		expect(queueMonitorStub.scheduleInquiry.calledWith(inquiry._id, new Date(newQueueTime.format()))).to.be.true;
	});
});
