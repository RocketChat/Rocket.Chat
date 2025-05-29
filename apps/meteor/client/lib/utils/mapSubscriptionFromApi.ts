import type { ISubscription, Serialized } from '@rocket.chat/core-typings';

export const mapSubscriptionFromApi = ({
	ts,
	lr,
	ls,
	_updatedAt,
	oldRoomKeys,
	suggestedOldRoomKeys,
	...subscription
}: Serialized<ISubscription>): ISubscription => ({
	...subscription,
	ts: new Date(ts),
	ls: new Date(ls),
	lr: new Date(lr),
	_updatedAt: new Date(_updatedAt),
	...(oldRoomKeys && { oldRoomKeys: oldRoomKeys.map(({ ts, ...key }) => ({ ...key, ts: new Date(ts) })) }),
	...(suggestedOldRoomKeys && { suggestedOldRoomKeys: suggestedOldRoomKeys.map(({ ts, ...key }) => ({ ...key, ts: new Date(ts) })) }),
});
