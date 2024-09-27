import { AirGappedRestriction } from './AirGappedRestriction';
import { StatsTokenBuilder } from './MockedLicenseBuilder';

describe('AirGappedRestriction', () => {
	describe('#checkRemainingDaysSinceLastStatsReport()', () => {
		it('should notify remaining days = 0 (apply restriction) when it was not possible to decrypt the stats token', async () => {
			const handler = jest.fn();

			AirGappedRestriction.on('remainingDays', handler);
			await AirGappedRestriction.checkRemainingDaysSinceLastStatsReport('invalid-token');

			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler).toHaveBeenCalledWith({
				days: 0,
			});
			expect(AirGappedRestriction.isRestricted).toBe(true);
		});
		it('should notify remaining days (8) within the accepted range (1 - 10) when the last reported stats happened 2 days ago', async () => {
			const now = new Date();
			now.setDate(now.getDate() - 2);
			const token = await new StatsTokenBuilder().withTimeStamp(now).sign();
			const handler = jest.fn();

			AirGappedRestriction.on('remainingDays', handler);
			await AirGappedRestriction.checkRemainingDaysSinceLastStatsReport(token);

			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler).toHaveBeenCalledWith({
				days: 8,
			});
			expect(AirGappedRestriction.isRestricted).toBe(false);
		});
		it('should notify remaining days = 0 (apply restrictions) when the last reported stats happened more than 10 days ago', async () => {
			const now = new Date();
			now.setDate(now.getDate() - 11);
			const token = await new StatsTokenBuilder().withTimeStamp(now).sign();
			const handler = jest.fn();

			AirGappedRestriction.on('remainingDays', handler);
			await AirGappedRestriction.checkRemainingDaysSinceLastStatsReport(token);

			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler).toHaveBeenCalledWith({
				days: 0,
			});
			expect(AirGappedRestriction.isRestricted).toBe(true);
		});
		it('should notify remaining days = 0 (apply restrictions) when the last reported stats happened 10 days ago', async () => {
			const now = new Date();
			now.setDate(now.getDate() - 10);
			const token = await new StatsTokenBuilder().withTimeStamp(now).sign();
			const handler = jest.fn();

			AirGappedRestriction.on('remainingDays', handler);
			await AirGappedRestriction.checkRemainingDaysSinceLastStatsReport(token);

			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler).toHaveBeenCalledWith({
				days: 0,
			});
			expect(AirGappedRestriction.isRestricted).toBe(true);
		});
	});
	describe('#applyRestrictions()', () => {
		it('should notify remaining days = 0 when restrictions should be applied', () => {
			const handler = jest.fn();

			AirGappedRestriction.on('remainingDays', handler);
			AirGappedRestriction.applyRestrictions();

			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler).toHaveBeenCalledWith({
				days: 0,
			});
			expect(AirGappedRestriction.isRestricted).toBe(true);
		});
	});
	describe('#removeRestrictions()', () => {
		it('should notify remaining days = -1 when restrictions should be reverted', () => {
			const handler = jest.fn();

			AirGappedRestriction.on('remainingDays', handler);
			AirGappedRestriction.removeRestrictions();

			expect(handler).toHaveBeenCalledTimes(1);
			expect(handler).toHaveBeenCalledWith({
				days: -1,
			});
			expect(AirGappedRestriction.isRestricted).toBe(false);
		});
	});
});
