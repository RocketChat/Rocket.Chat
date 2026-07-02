import type { ILivechatInquiryRecord } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import moment from 'moment';
import { beforeEach, describe, it, vi } from 'vitest';

// Stubs are built in `vi.hoisted` so the hoisted `vi.mock` factories can reference them. sinon is
// require()d inside the hoisted block because the top-level import has not executed at hoist time.
// NOTE: relative `vi.mock` specifiers are resolved relative to THIS spec file (not the source).
const { settingStub, queueMonitorStub, afterInquiryQueuedPatch } = vi.hoisted(() => {
	const sinon = require('sinon');
	return {
		settingStub: {
			watch: sinon.stub(),
			get: sinon.stub(),
		},
		queueMonitorStub: {
			scheduleInquiry: sinon.stub(),
		},
		afterInquiryQueuedPatch: sinon.stub(),
	};
});

vi.mock('../../../../../../../app/settings/server', () => ({ settings: settingStub }));
vi.mock('../../../../../../app/livechat-enterprise/server/lib/QueueInactivityMonitor', () => ({
	OmnichannelQueueInactivityMonitor: queueMonitorStub,
}));
vi.mock('../../../../../../../app/livechat/server/lib/hooks', () => ({
	afterInquiryQueued: { patch: afterInquiryQueuedPatch },
}));

const { afterInquiryQueuedFunc: afterInquiryQueued } = await import(
	'../../../../../../app/livechat-enterprise/server/hooks/afterInquiryQueued'
);

describe('hooks/afterInquiryQueued', () => {
	beforeEach(() => {
		queueMonitorStub.scheduleInquiry.resetHistory();
		settingStub.get.resetHistory();
	});

	it('should return undefined if no inquiry is passed, or if inquiry doesnt have valid properties', async () => {
		expect(await afterInquiryQueued(null as unknown as ILivechatInquiryRecord)).to.be.equal(undefined);
		expect(await afterInquiryQueued({} as unknown as ILivechatInquiryRecord)).to.be.equal(undefined);
		expect(await afterInquiryQueued({ _id: 'invalid' } as unknown as ILivechatInquiryRecord)).to.be.equal(undefined);
		expect(await afterInquiryQueued({ _updatedAt: new Date() } as unknown as ILivechatInquiryRecord));
		expect(await afterInquiryQueued({ _updatedAt: null, _id: 'afsd34asdX' } as unknown as ILivechatInquiryRecord)).to.be.equal(undefined);
	});

	it('should do nothing if timer is set to 0 or less', async () => {
		const inquiry = {
			_id: 'afsd34asdX',
			_updatedAt: new Date(),
		} as unknown as ILivechatInquiryRecord;

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
		} as unknown as ILivechatInquiryRecord;

		settingStub.get.returns(1);
		await afterInquiryQueued(inquiry);

		const newQueueTime = moment(inquiry._updatedAt).add(1, 'minutes');

		expect(queueMonitorStub.scheduleInquiry.calledWith(inquiry._id, new Date(newQueueTime.format()))).to.be.true;
	});

	it('should call .scheduleInquiry with proper data when more than 1 min is passed as param', async () => {
		const inquiry = {
			_id: 'afv34avzx',
			_updatedAt: new Date(),
		} as unknown as ILivechatInquiryRecord;

		settingStub.get.returns(3);
		await afterInquiryQueued(inquiry);

		const newQueueTime = moment(inquiry._updatedAt).add(3, 'minutes');

		expect(queueMonitorStub.scheduleInquiry.calledWith(inquiry._id, new Date(newQueueTime.format()))).to.be.true;
	});
});
