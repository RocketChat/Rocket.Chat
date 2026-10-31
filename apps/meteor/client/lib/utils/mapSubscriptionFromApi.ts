import type { ISubscription, Serialized } from '@rocket.chat/core-typings';

export const mapSubscriptionFromApi = ({
	ts,
	lr,
	ls,
	_updatedAt,
	oldRoomKeys,
	suggestedOldRoomKeys,
	abacLastTimeChecked,
	historyVisibleFrom,
	...subscription
}: Serialized<ISubscription>): ISubscription => ({
	...subscription,
	ts: new Date(ts),
	...(ls && { ls: new Date(ls) }),
	...(lr && { lr: new Date(lr) }),
	_updatedAt: new Date(_updatedAt),
	...(abacLastTimeChecked && { abacLastTimeChecked: new Date(abacLastTimeChecked) }),
	...(historyVisibleFrom && { historyVisibleFrom: new Date(historyVisibleFrom) }),
	...(oldRoomKeys && { oldRoomKeys: oldRoomKeys.map(({ ts, ...key }) => ({ ...key, ts: new Date(ts) })) }),
	...(suggestedOldRoomKeys && { suggestedOldRoomKeys: suggestedOldRoomKeys.map(({ ts, ...key }) => ({ ...key, ts: new Date(ts) })) }),
});
