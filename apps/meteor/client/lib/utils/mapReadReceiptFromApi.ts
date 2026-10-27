import type { IReadReceiptWithUser, Serialized } from '@rocket.chat/core-typings';

export const mapReadReceiptFromApi = ({ ts, _updatedAt, ...receipt }: Serialized<IReadReceiptWithUser>): IReadReceiptWithUser => ({
	...receipt,
	ts: new Date(ts),
	_updatedAt: new Date(_updatedAt),
});
