import { AirGappedRestriction } from '@rocket.chat/license';
import { Statistics } from '@rocket.chat/models';

import { sendUsageReportAndComputeRestriction } from './usageReport';

jest.mock('@rocket.chat/license', () => ({
	AirGappedRestriction: {
		computeRestriction: jest.fn(),
	},
}));

jest.mock('@rocket.chat/models', () => ({
	Statistics: {
		findLastStatsToken: jest.fn(),
	},
}));

jest.mock('../../app/statistics/server/functions/sendUsageReport', () => ({
	sendUsageReport: () => undefined,
}));

describe('sendUsageReportAndComputeRestriction', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should pass statsToken to computeRestriction when provided', async () => {
		const mockStatsToken = 'test-token';
		await sendUsageReportAndComputeRestriction(mockStatsToken);

		expect(AirGappedRestriction.computeRestriction).toHaveBeenCalledWith(mockStatsToken);
		expect(Statistics.findLastStatsToken).not.toHaveBeenCalled();
	});

	it('should use findLastStatsToken result when statsToken is omitted', async () => {
		const mockLastToken = 'last-token';
		(Statistics.findLastStatsToken as jest.Mock).mockResolvedValue(mockLastToken);

		await sendUsageReportAndComputeRestriction();

		expect(Statistics.findLastStatsToken).toHaveBeenCalled();
		expect(AirGappedRestriction.computeRestriction).toHaveBeenCalledWith(mockLastToken);
	});

	it('should pass undefined to computeRestriction when both statsToken is omitted and findLastStatsToken returns undefined', async () => {
		(Statistics.findLastStatsToken as jest.Mock).mockResolvedValue(undefined);

		await sendUsageReportAndComputeRestriction();

		expect(Statistics.findLastStatsToken).toHaveBeenCalled();
		expect(AirGappedRestriction.computeRestriction).toHaveBeenCalledWith(undefined);
	});
});
