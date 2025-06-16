import { AirGappedRestriction } from './AirGappedRestriction';
import { StatsTokenBuilder } from './MockedLicenseBuilder';
import { License } from './licenseImp';

jest.mock('./licenseImp', () => ({
	License: {
		hasValidLicense: jest.fn().mockReturnValue(false),
	},
}));

describe('AirGappedRestriction', () => {
	describe('#computeRestriction()', () => {
		it('should notify remaining days = 0 (apply restriction) when token is not a string', async () => {
			const handler = jest.fn();

			AirGappedRestriction.on('remainingDays', handler);
			await AirGappedRestriction.computeRestriction();

			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler).toHaveBeenCalledWith({
				days: 0,
			});
			expect(AirGappedRestriction.restricted).toBe(true);
		});
		it('should notify remaining days = 0 (apply restriction) when it was not possible to decrypt the stats token', async () => {
			const handler = jest.fn();

			AirGappedRestriction.on('remainingDays', handler);
			await AirGappedRestriction.computeRestriction('invalid-token');

			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler).toHaveBeenCalledWith({
				days: 0,
			});
			expect(AirGappedRestriction.restricted).toBe(true);
		});
		it('should notify remaining days (8) within the accepted range (1 - 10) when the last reported stats happened 2 days ago', async () => {
			const now = new Date();
			now.setDate(now.getDate() - 2);
			const token = await new StatsTokenBuilder().withTimeStamp(now).sign();
			const handler = jest.fn();

			AirGappedRestriction.on('remainingDays', handler);
			await AirGappedRestriction.computeRestriction(token);

			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler).toHaveBeenCalledWith({
				days: 8,
			});
			expect(AirGappedRestriction.restricted).toBe(false);
		});
		it('should notify remaining days = 0 (apply restrictions) when the last reported stats happened more than 10 days ago', async () => {
			const now = new Date();
			now.setDate(now.getDate() - 11);
			const token = await new StatsTokenBuilder().withTimeStamp(now).sign();
			const handler = jest.fn();

			AirGappedRestriction.on('remainingDays', handler);
			await AirGappedRestriction.computeRestriction(token);

			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler).toHaveBeenCalledWith({
				days: 0,
			});
			expect(AirGappedRestriction.restricted).toBe(true);
		});
		it('should notify remaining days = 0 (apply restrictions) when the last reported stats happened 10 days ago', async () => {
			const now = new Date();
			now.setDate(now.getDate() - 10);
			const token = await new StatsTokenBuilder().withTimeStamp(now).sign();
			const handler = jest.fn();

			AirGappedRestriction.on('remainingDays', handler);
			await AirGappedRestriction.computeRestriction(token);

			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler).toHaveBeenCalledWith({
				days: 0,
			});
			expect(AirGappedRestriction.restricted).toBe(true);
		});
		it('should notify remaining days = -1 when has valid license', () => {
			const handler = jest.fn();
			(License.hasValidLicense as jest.Mock).mockReturnValueOnce(true);

			AirGappedRestriction.on('remainingDays', handler);
			AirGappedRestriction.computeRestriction();

			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler).toHaveBeenCalledWith({
				days: -1,
			});
			expect(AirGappedRestriction.restricted).toBe(false);
		});
	});
	describe('#isWarningPeriod', () => {
		it('should return true if value is between or exactly 0 and 7', async () => {
			expect(AirGappedRestriction.isWarningPeriod(0)).toBe(true);
			expect(AirGappedRestriction.isWarningPeriod(1)).toBe(true);
			expect(AirGappedRestriction.isWarningPeriod(2)).toBe(true);
			expect(AirGappedRestriction.isWarningPeriod(3)).toBe(true);
			expect(AirGappedRestriction.isWarningPeriod(4)).toBe(true);
			expect(AirGappedRestriction.isWarningPeriod(5)).toBe(true);
			expect(AirGappedRestriction.isWarningPeriod(6)).toBe(true);
			expect(AirGappedRestriction.isWarningPeriod(7)).toBe(true);
		});
		it('should return false if value is lesser than 0 or bigger than 7', async () => {
			expect(AirGappedRestriction.isWarningPeriod(-1)).toBe(false);
			expect(AirGappedRestriction.isWarningPeriod(8)).toBe(false);
			expect(AirGappedRestriction.isWarningPeriod(10)).toBe(false);
		});
	});
});
