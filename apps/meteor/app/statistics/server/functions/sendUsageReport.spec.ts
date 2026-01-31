import type { Logger } from '@rocket.chat/logger';
import { Statistics } from '@rocket.chat/models';
import { serverFetch } from '@rocket.chat/server-fetch';

import { statistics } from '..';
import { sendUsageReport } from './sendUsageReport';

jest.mock('@rocket.chat/models', () => ({
	Statistics: {
		findLast: jest.fn(),
		updateOne: jest.fn(),
	},
}));

jest.mock('@rocket.chat/server-fetch', () => ({
	serverFetch: jest.fn(),
}));

jest.mock('..', () => ({
	statistics: {
		save: jest.fn(),
	},
}));

jest.mock('../../../cloud/server', () => ({
	getWorkspaceAccessToken: jest.fn().mockResolvedValue('workspace-token'),
}));

jest.mock('meteor/meteor', () => ({
	Meteor: {
		absoluteUrl: jest.fn().mockReturnValue('http://localhost:3000/'),
	},
}));

jest.mock('../../../utils/rocketchat.info', () => ({
	Info: {
		version: '3.0.1',
	},
}));

require('@rocket.chat/models');
require('@rocket.chat/server-fetch');
require('..');
require('../../../cloud/server');
require('meteor/meteor');
require('../../../utils/rocketchat.info');

const mockFindLast = Statistics.findLast as jest.Mock;
const mockSave = statistics.save as jest.Mock;
const mockServerFetch = serverFetch as jest.Mock;

describe('sendUsageReport', () => {
	const mockLogger = {
		error: jest.fn(),
	} as unknown as Logger;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	afterEach(() => {
		delete process.env.RC_DISABLE_STATISTICS_REPORTING;
	});

	it('should save statistics locally and not send to collector when RC_DISABLE_STATISTICS_REPORTING is true', async () => {
		process.env.RC_DISABLE_STATISTICS_REPORTING = 'true';

		const result = await sendUsageReport(mockLogger);

		expect(mockSave).toHaveBeenCalled();
		expect(mockServerFetch).not.toHaveBeenCalled();
		expect(result).toBeUndefined();
	});

	it('should save statistics locally and send to collector when RC_DISABLE_STATISTICS_REPORTING is false', async () => {
		process.env.RC_DISABLE_STATISTICS_REPORTING = 'false';

		const result = await sendUsageReport(mockLogger);

		expect(mockSave).toHaveBeenCalled();
		expect(mockServerFetch).toHaveBeenCalledTimes(1);
		expect(mockServerFetch).toHaveBeenCalledWith('https://collector.rocket.chat/', expect.objectContaining({ method: 'POST' }));
		expect(result).toBeUndefined();
	});

	it('should generate new statistics when version changes', async () => {
		mockFindLast.mockResolvedValue({
			_id: 'stats-id',
			version: '2.9.0',
			createdAt: new Date(),
		});

		mockSave.mockResolvedValue({ _id: 'new-stats-id' });

		const result = await sendUsageReport(mockLogger);

		expect(mockSave).toHaveBeenCalledTimes(1);
		expect(result).toBeUndefined();
	});

	it('should NOT generate new statistics if last version equals current version', async () => {
		mockFindLast.mockResolvedValue({
			_id: 'stats-id',
			version: '3.0.1',
			createdAt: new Date(),
			statsToken: 'token',
		});

		const result = await sendUsageReport(mockLogger);

		expect(mockSave).not.toHaveBeenCalled();
		expect(result).toBe('token');
	});

	it('should generate new statistics when no previous stats exist', async () => {
		mockFindLast.mockResolvedValue(undefined);
		mockSave.mockResolvedValue({ _id: 'new-stats-id' });

		await sendUsageReport(mockLogger);

		expect(mockSave).toHaveBeenCalledTimes(1);
	});
});
