import type {
	IDirectVideoConference,
	IGroupVideoConference,
	IVideoConferenceHistoryItem,
	IVideoConferenceUser,
	VideoConference,
} from '@rocket.chat/core-typings';
import { hasJoinedVideoConference, isInVideoConference } from '@rocket.chat/core-typings';
import type { InsertionModel } from '@rocket.chat/model-typings';

/**
 * How long a conference is kept alive after the last participant leaves, before it is ended.
 *
 * Leaving is reported on `pagehide`, which fires on a reload exactly as it does on a close — so without a pause
 * refreshing the call window ended the call. Long enough for a reload to land and cancel it, short enough that a
 * call really over doesn't linger.
 */
export const EMPTY_CALL_GRACE_MS = 10_000;

/** A conference that belongs in a call log: someone called someone, whether one-to-one or as a group. */
export type LoggableVideoConference = IDirectVideoConference | IGroupVideoConference;

/**
 * Whether a conference belongs in a user's call log at all.
 *
 * Livechat and VoIP conferences are out of scope. A livechat call belongs to a visitor rather than to a user's
 * own call log, and VoIP conferences are already logged as media calls — logging them here would double them up.
 *
 * Every other conference is logged from the moment it starts, and its entries are kept up to date as it runs —
 * see `buildConferenceCallHistoryItems`. Repeats are harmless: the write is an upsert keyed by member and call,
 * which matters because both ways a conference stops are reachable more than once (an app can send `ENDED`
 * repeatedly, and the expiry cron runs every three hours).
 */
export const isLoggableConference = (call: VideoConference): call is LoggableVideoConference =>
	call.type === 'direct' || call.type === 'videoconference';

/**
 * Whether anyone is still in the call. Used to decide that a conference is over: membership doesn't end when
 * someone leaves, so the only way to tell is that nobody who joined is still there.
 */
export const hasActiveParticipants = (users: Pick<IVideoConferenceUser, 'joined' | 'leftAt'>[]): boolean => users.some(isInVideoConference);

/**
 * Builds one call-history item per conference member, so a conference appears in every member's personal call
 * history — from the moment it starts, not only once it is over.
 *
 * A call in progress is a call that happened; it just hasn't finished. Writing it at the start is what lets the
 * history be the single list of calls, with `ongoing` as a state like any other — and what gives a member who
 * declined somewhere to go back to it. The items are rewritten as the call runs and once more when it ends, so
 * the count of who was there and each member's final state settle then.
 *
 * Only members with an entry in `users[]` get an item — someone rung as a room subscriber who never joined, was
 * never added, and never declined has no membership entry to build from.
 */
export const buildConferenceCallHistoryItems = (
	call: Pick<LoggableVideoConference, '_id' | 'rid' | 'createdAt' | 'createdBy' | 'users'> & { title?: string },
	{ ended }: { ended: boolean },
): InsertionModel<IVideoConferenceHistoryItem>[] => {
	const usersCount = call.users.filter(hasJoinedVideoConference).length;

	// While it runs, every member's row says the same thing: this call is happening. Only once it is over does a
	// member's own outcome exist — and then, because only members appear here, a member either joined or was rung
	// and didn't. So not having joined *is* not having answered, whether they declined explicitly or just ignored
	// it; showing that as a normal ended call would hide a missed conference.
	const stateOf = (member: IVideoConferenceUser): IVideoConferenceHistoryItem['state'] => {
		if (!ended) {
			return 'ongoing';
		}

		return hasJoinedVideoConference(member) ? 'ended' : 'not-answered';
	};

	return call.users.map((member) => ({
		uid: member._id,
		ts: call.createdAt,
		callId: call._id,
		type: 'video-conference',
		rid: call.rid,
		...(call.title && { title: call.title }),
		usersCount,
		direction: member._id === call.createdBy._id ? 'outbound' : 'inbound',
		state: stateOf(member),
	}));
};
