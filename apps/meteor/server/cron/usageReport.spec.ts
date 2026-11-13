import { AirGappedRestriction } from '@rocket.chat/license';
import { mockModel } from '@rocket.chat/models/testing';

import { sendUsageReportAndComputeRestriction } from './usageReport';

jest.mock('@rocket.chat/license', () => ({
	AirGappedRestriction: {
		computeRestriction: jest.fn(),
	},
}));

const statisticsModel = {
	findLastStatsToken: jest.fn(),
};

jest.mock('../lib/statistics/functions/sendUsageReport', () => ({
	sendUsageReport: () => undefined,
}));

describe('sendUsageReportAndComputeRestriction', () => {
	beforeAll(() => {
		mockModel('Statistics', statisticsModel);
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should pass statsToken to computeRestriction when provided', async () => {
		const mockStatsToken = 'test-token';
		await sendUsageReportAndComputeRestriction(mockStatsToken);

		expect(AirGappedRestriction.computeRestriction).toHaveBeenCalledWith(mockStatsToken);
		expect(statisticsModel.findLastStatsToken).not.toHaveBeenCalled();
	});

	it('should use findLastStatsToken result when statsToken is omitted', async () => {
		const mockLastToken = 'last-token';
		statisticsModel.findLastStatsToken.mockResolvedValue(mockLastToken);

		await sendUsageReportAndComputeRestriction();

		expect(statisticsModel.findLastStatsToken).toHaveBeenCalled();
		expect(AirGappedRestriction.computeRestriction).toHaveBeenCalledWith(mockLastToken);
	});

	it('should pass undefined to computeRestriction when both statsToken is omitted and findLastStatsToken returns undefined', async () => {
		statisticsModel.findLastStatsToken.mockResolvedValue(undefined);

		await sendUsageReportAndComputeRestriction();

		expect(statisticsModel.findLastStatsToken).toHaveBeenCalled();
		expect(AirGappedRestriction.computeRestriction).toHaveBeenCalledWith(undefined);
	});
});
