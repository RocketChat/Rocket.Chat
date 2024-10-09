import type { MACStats } from './mac';

declare module '@rocket.chat/core-typings' {
	interface IStats {
		omnichannelContactsBySource: MACStats;
		uniqueContactsOfLastMonth: MACStats;
		uniqueContactsOfLastWeek: MACStats;
		uniqueContactsOfYesterday: MACStats;
	}
}
