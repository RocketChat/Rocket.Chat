/**
 * How a finished call is summarized in the history log.
 *
 * This is a coarser vocabulary than the reason the call actually ended: Rocket.Chat
 * derives it from the call's hangup reason when it writes the history row. Read
 * `ICallHistoryCallDetails.hangupReason` when the precise cause matters.
 */
export type CallHistoryState =
	/** One of the two parties hung up an established call. */
	| 'ended'
	/** The call rang but was never answered, including a rejection. */
	| 'not-answered'
	/** The call could not be established at all. */
	| 'failed'
	/** The call was established and then ended because of an error. */
	| 'error'
	/** The call ended because it was transferred to someone else. */
	| 'transferred';

/**
 * Who the workspace user spoke to.
 *
 * A call to or from the outside world identifies the other party only by number —
 * there is no workspace user behind it, so always check `type` before treating this
 * as a user reference.
 */
export type CallHistoryContact =
	| {
			type: 'user';
			userId: string;
			username?: string;
			displayName?: string;
	  }
	| {
			type: 'external';
			/** The phone number or SIP extension of the external party. */
			number: string;
	  };

/**
 * One row of the call history log.
 *
 * The log is kept per participant, not per call: an internal call between two
 * workspace users writes **two** items that share a `callId` — one `'outbound'` for
 * the caller and one `'inbound'` for the callee. Count calls by `callId`, not by item.
 */
export interface ICallHistoryItem {
	id: string;

	/** The call this row summarizes. Shared by both rows of an internal call. */
	callId: string;

	/** The workspace user whose history this row belongs to. */
	uid: string;

	/** When the call was created. */
	ts: Date;

	/** When the call ended. */
	endedAt: Date;

	/** Whether `uid` placed the call or received it. */
	direction: 'inbound' | 'outbound';

	state: CallHistoryState;

	/**
	 * How long media was flowing, in whole seconds, rounded down. `0` for a call that
	 * never became active — a call nobody answered lasted no time, however long it rang.
	 *
	 * This measures `ICallHistoryCallDetails.activatedAt` to `endedAt`, so it is not the
	 * time between `ts` and `endedAt`: the ring is not counted.
	 */
	durationSeconds: number;

	contact: CallHistoryContact;

	/** The room the call happened in, for a call between workspace users. */
	roomId?: string;

	/** The message Rocket.Chat posted to `roomId` once the call ended. */
	messageId?: string;
}
