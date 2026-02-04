import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import proxyquire from 'proxyquire';
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
	Meteor: {
		absoluteUrl: sandbox.stub().returns('http://localhost:3000/'),
	},
	logger: {
		error: sandbox.stub(),
	},
};

const { sendUsageReport } = proxyquire.noCallThru().load('./sendUsageReport', {
	'@rocket.chat/models': { Statistics: mocks.Statistics },
	'@rocket.chat/server-fetch': { serverFetch: mocks.serverFetch },
	'..': { statistics: mocks.statistics },
	'../../../cloud/server': { getWorkspaceAccessToken: mocks.getWorkspaceAccessToken },
	'meteor/meteor': { Meteor: mocks.Meteor },
});

describe('sendUsageReport', () => {
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
		expect(result).to.be.undefined;
	});
});
