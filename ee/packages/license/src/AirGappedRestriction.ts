import EventEmitter from 'events';

import { License } from '.';
import { decryptStatsToken } from './token';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const NO_ACTION_PERIOD_IN_DAYS = 3;
const WARNING_PERIOD_IN_DAYS = 7;

class AirGappedRestrictionClass extends EventEmitter {
	#restricted = true;

	public get restricted(): boolean {
		return this.#restricted;
	}

	public async computeRestriction(encryptedToken?: string): Promise<void> {
		if (License.hasValidLicense()) {
			this.removeRestrictionsUnderLicense();
			return;
		}

		if (typeof encryptedToken !== 'string') {
			this.applyRestrictions();
			return;
		}

		return this.checkRemainingDaysSinceLastStatsReport(encryptedToken);
	}

	private async checkRemainingDaysSinceLastStatsReport(encryptedToken: string): Promise<void> {
		try {
			const { timestamp: lastStatsReportTimestamp } = JSON.parse(await decryptStatsToken(encryptedToken));
			const now = new Date();
			const lastStatsReport = new Date(lastStatsReportTimestamp);
			const nowUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
			const lastStatsReportUTC = Date.UTC(lastStatsReport.getFullYear(), lastStatsReport.getMonth(), lastStatsReport.getDate());

			const daysSinceLastStatsReport = Math.floor((nowUTC - lastStatsReportUTC) / DAY_IN_MS);

			this.notifyRemainingDaysUntilRestriction(daysSinceLastStatsReport);
		} catch {
			this.applyRestrictions();
		}
	}

	private applyRestrictions(): void {
		this.notifyRemainingDaysUntilRestriction(NO_ACTION_PERIOD_IN_DAYS + WARNING_PERIOD_IN_DAYS);
	}

	private removeRestrictionsUnderLicense(): void {
		this.#restricted = false;
		this.emit('remainingDays', { days: -1 });
	}

	public isWarningPeriod(days: number) {
		if (days < 0) {
			return false;
		}
		return days <= WARNING_PERIOD_IN_DAYS;
	}

	private notifyRemainingDaysUntilRestriction(daysSinceLastStatsReport: number): void {
		const remainingDaysUntilRestriction = Math.max(NO_ACTION_PERIOD_IN_DAYS + WARNING_PERIOD_IN_DAYS - daysSinceLastStatsReport, 0);

		this.#restricted = remainingDaysUntilRestriction === 0;
		this.emit('remainingDays', { days: remainingDaysUntilRestriction });
	}
}

const airGappedRestriction = new AirGappedRestrictionClass();

export { airGappedRestriction as AirGappedRestriction };
