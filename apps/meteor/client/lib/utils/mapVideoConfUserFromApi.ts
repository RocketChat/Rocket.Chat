import type { IVideoConferenceUser, Serialized } from '@rocket.chat/core-typings';

const mapMemberFederationFromApi = ({
	handRaisedAt,
	...federation
}: NonNullable<Serialized<IVideoConferenceUser>['federation']>): NonNullable<IVideoConferenceUser['federation']> => ({
	...federation,
	...(handRaisedAt && { handRaisedAt: new Date(handRaisedAt) }),
});

/**
 * Revives the dates on a conference member. Membership carries several optional timestamps and each one
 * arrives as a string over REST, so they are handled in one place — adding a field to
 * `IVideoConferenceUser` without deserializing it here is otherwise only caught by a type error at the
 * consumer, far from the cause.
 */
export const mapVideoConfUserFromApi = ({
	ts,
	joinedAt,
	declinedAt,
	leftAt,
	lastSeenAt,
	ringingAt,
	federation,
	...user
}: Serialized<IVideoConferenceUser>): IVideoConferenceUser => ({
	...user,
	...(federation && { federation: mapMemberFederationFromApi(federation) }),
	ts: new Date(ts),
	...(joinedAt && { joinedAt: new Date(joinedAt) }),
	...(declinedAt && { declinedAt: new Date(declinedAt) }),
	...(leftAt && { leftAt: new Date(leftAt) }),
	...(lastSeenAt && { lastSeenAt: new Date(lastSeenAt) }),
	...(ringingAt && { ringingAt: new Date(ringingAt) }),
});
