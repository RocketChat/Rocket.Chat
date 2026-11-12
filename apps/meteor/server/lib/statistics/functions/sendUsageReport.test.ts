import { afterEach, before, beforeEach, describe, it, mock } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const mocks = {
	Statistics: {
		findLast: sandbox.stub(),
		updateOne: sandbox.stub(),
	},
	statistics: {
		save: sandbox.stub(),
	},
	serverFetch: sandbox.stub(),
	getWorkspaceAccessToken: sandbox.stub().resolves('workspace-token'),
	getWorkspaceURL: sandbox.stub().returns('http://localhost:3000'),
	logger: {
		error: sandbox.stub(),
	},
	Info: {
		version: '3.0.1',
	},
};

let sendUsageReport: any;

before(async () => {
	const moduleMocks = [
		mock.module('@rocket.chat/server-fetch', { exports: { serverFetch: mocks.serverFetch } }),
		mock.module('../index', { exports: { statistics: mocks.statistics } }),
		mock.module('../../cloud', { exports: { getWorkspaceAccessToken: mocks.getWorkspaceAccessToken } }),
		mock.module('../../utils/getURL', { exports: { getWorkspaceURL: mocks.getWorkspaceURL } }),
		mock.module('../../../../rocketchat.info', { exports: { Info: mocks.Info } }),
	];
	({ sendUsageReport } = await import('./sendUsageReport'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
});

describe('sendUsageReport', () => {
	before(() => {
		mockModel('Statistics', mocks.Statistics);
	});

	beforeEach(() => {
		sandbox.resetHistory();
	});

	afterEach(() => {
		delete process.env.RC_DISABLE_STATISTICS_REPORTING;
	});

	it('should save statistics locally and not send to collector when RC_DISABLE_STATISTICS_REPORTING is true', async () => {
		process.env.RC_DISABLE_STATISTICS_REPORTING = 'true';

		const result = await sendUsageReport(mocks.logger);

		expect(mocks.statistics.save.called).to.be.true;
		expect(mocks.serverFetch.called).to.be.false;
		expect(result).to.be.undefined;
	});

	it('should save statistics locally and send to collector when RC_DISABLE_STATISTICS_REPORTING is false', async () => {
		process.env.RC_DISABLE_STATISTICS_REPORTING = 'false';

		const result = await sendUsageReport(mocks.logger);

		expect(mocks.statistics.save.called).to.be.true;
		expect(mocks.serverFetch.calledOnce).to.be.true;
		expect(mocks.serverFetch.calledWith('https://collector.rocket.chat/', sinon.match({ method: 'POST' }))).to.be.true;
		expect(mocks.serverFetch.firstCall.args[1].body.host).to.equal('http://localhost:3000/');
		expect(result).to.be.undefined;
	});

	it('should generate new statistics when version changes', async () => {
		mocks.Statistics.findLast.resolves({
			_id: 'stats-id',
			version: '2.9.0',
			createdAt: new Date(),
		});

		mocks.statistics.save.resolves({ _id: 'new-stats-id' });

		const result = await sendUsageReport(mocks.logger);

		expect(mocks.statistics.save.calledOnce).to.be.true;
		expect(result).to.be.undefined;
	});

	it('should NOT generate new statistics if last version equals current version', async () => {
		mocks.Statistics.findLast.resolves({
			_id: 'stats-id',
			version: '3.0.1',
			createdAt: new Date(),
			statsToken: 'token',
		});

		const result = await sendUsageReport(mocks.logger);

		expect(mocks.statistics.save.called).to.be.false;
		expect(result).to.equal('token');
	});

	it('should generate new statistics when no previous stats exist', async () => {
		mocks.Statistics.findLast.resolves(undefined);
		mocks.statistics.save.resolves({ _id: 'new-stats-id' });

		await sendUsageReport(mocks.logger);

		expect(mocks.statistics.save.calledOnce).to.be.true;
	});
});
