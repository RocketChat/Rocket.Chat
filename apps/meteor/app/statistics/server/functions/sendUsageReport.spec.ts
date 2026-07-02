import type { Logger } from '@rocket.chat/logger';
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach, vi } from 'vitest';

const { sandbox, mocks, sinonMatch } = vi.hoisted(() => {
	const sinon = require('sinon');
	const sandbox = sinon.createSandbox();
	return {
		sandbox,
		sinonMatch: sinon.match,
		mocks: {
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
			Info: {
				version: '3.0.1',
			},
		},
	};
});

vi.mock('@rocket.chat/models', () => ({ Statistics: mocks.Statistics }));
vi.mock('@rocket.chat/server-fetch', () => ({ serverFetch: mocks.serverFetch }));
vi.mock('..', () => ({ statistics: mocks.statistics }));
vi.mock('../../../cloud/server', () => ({ getWorkspaceAccessToken: mocks.getWorkspaceAccessToken }));
vi.mock('meteor/meteor', () => ({ Meteor: mocks.Meteor }));
vi.mock('../../../utils/rocketchat.info', () => ({ Info: mocks.Info }));

const { sendUsageReport } = await import('./sendUsageReport');

describe('sendUsageReport', () => {
	beforeEach(() => {
		sandbox.resetHistory();
	});

	afterEach(() => {
		delete process.env.RC_DISABLE_STATISTICS_REPORTING;
	});

	it('should save statistics locally and not send to collector when RC_DISABLE_STATISTICS_REPORTING is true', async () => {
		process.env.RC_DISABLE_STATISTICS_REPORTING = 'true';

		const result = await sendUsageReport(mocks.logger as unknown as Logger);

		expect(mocks.statistics.save.called).to.be.true;
		expect(mocks.serverFetch.called).to.be.false;
		expect(result).to.be.undefined;
	});

	it('should save statistics locally and send to collector when RC_DISABLE_STATISTICS_REPORTING is false', async () => {
		process.env.RC_DISABLE_STATISTICS_REPORTING = 'false';

		const result = await sendUsageReport(mocks.logger as unknown as Logger);

		expect(mocks.statistics.save.called).to.be.true;
		expect(mocks.serverFetch.calledOnce).to.be.true;
		expect(mocks.serverFetch.calledWith('https://collector.rocket.chat/', sinonMatch({ method: 'POST' }))).to.be.true;
		expect(result).to.be.undefined;
	});

	it('should generate new statistics when version changes', async () => {
		mocks.Statistics.findLast.resolves({
			_id: 'stats-id',
			version: '2.9.0',
			createdAt: new Date(),
		});

		mocks.statistics.save.resolves({ _id: 'new-stats-id' });

		const result = await sendUsageReport(mocks.logger as unknown as Logger);

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

		const result = await sendUsageReport(mocks.logger as unknown as Logger);

		expect(mocks.statistics.save.called).to.be.false;
		expect(result).to.equal('token');
	});

	it('should generate new statistics when no previous stats exist', async () => {
		mocks.Statistics.findLast.resolves(undefined);
		mocks.statistics.save.resolves({ _id: 'new-stats-id' });

		await sendUsageReport(mocks.logger as unknown as Logger);

		expect(mocks.statistics.save.calledOnce).to.be.true;
	});
});
