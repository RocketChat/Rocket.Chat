import type { ICallHistoryCallDetails } from './ICallHistoryCallDetails';
import type { ICallHistoryItem } from './ICallHistoryItem';

/**
 * One finished call as an app reads it: the history row, plus the call record it was
 * derived from.
 *
 * The two halves answer different questions. `item` says who the call was with, which
 * direction it went and how long it lasted; `call` says precisely why it ended. Reports
 * usually need both.
 */
export interface ICallHistoryEntry {
	item: ICallHistoryItem;

	/**
	 * Absent when the call record is gone. Rocket.Chat keeps history rows longer than the
	 * calls they came from, so an old entry may carry no detail — treat this as optional
	 * every time, rather than as a sign something is wrong.
	 */
	call?: ICallHistoryCallDetails;
}
