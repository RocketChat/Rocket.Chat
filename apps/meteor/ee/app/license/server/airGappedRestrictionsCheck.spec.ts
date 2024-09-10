import { License, AirGappedRestriction } from '@rocket.chat/license';
import { Statistics } from '@rocket.chat/models';

import { checkAirGappedRestrictions } from './airGappedRestrictionsCheck';

jest.mock('@rocket.chat/models', () => ({
	Statistics: { findLast: jest.fn() },
}));

jest.mock('@rocket.chat/license', () => ({
	License: { hasModule: jest.fn() },
	AirGappedRestriction: { removeRestrictions: jest.fn(), applyRestrictions: jest.fn(), checkRemainingDaysSinceLastStatsReport: jest.fn() },
}));

describe('#checkAirGappedRestrictions()', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should remove any restriction and not to check the validity of the stats token when the workspace has "unlimited-presence" module enabled', async () => {
		(License.hasModule as jest.Mock).mockReturnValueOnce(true);
		await checkAirGappedRestrictions();
		expect(AirGappedRestriction.removeRestrictions).toHaveBeenCalledTimes(1);
		expect(AirGappedRestriction.applyRestrictions).not.toHaveBeenCalled();
		expect(AirGappedRestriction.checkRemainingDaysSinceLastStatsReport).not.toHaveBeenCalled();
	});

	it('should apply restrictions right away when the workspace doesnt contain a license with the previous module enabled AND there is no statsToken (no report was made before)', async () => {
		(License.hasModule as jest.Mock).mockReturnValueOnce(false);
		(Statistics.findLast as jest.Mock).mockReturnValueOnce(undefined);
		await checkAirGappedRestrictions();
		expect(AirGappedRestriction.applyRestrictions).toHaveBeenCalledTimes(1);
		expect(AirGappedRestriction.removeRestrictions).not.toHaveBeenCalled();
		expect(AirGappedRestriction.checkRemainingDaysSinceLastStatsReport).not.toHaveBeenCalled();
	});

	it('should check the statsToken validity if there is no valid license and a report to the cloud was made before', async () => {
		(License.hasModule as jest.Mock).mockReturnValueOnce(false);
		(Statistics.findLast as jest.Mock).mockReturnValueOnce({ statsToken: 'token' });
		await checkAirGappedRestrictions();
		expect(AirGappedRestriction.applyRestrictions).not.toHaveBeenCalled();
		expect(AirGappedRestriction.removeRestrictions).not.toHaveBeenCalled();
		expect(AirGappedRestriction.checkRemainingDaysSinceLastStatsReport).toHaveBeenCalledWith('token');
	});
});
