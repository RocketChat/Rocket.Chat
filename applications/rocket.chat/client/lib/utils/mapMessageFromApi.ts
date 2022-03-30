import { IMessage, Serialized } from '@rocket.chat/core-typings';

export const mapMessageFromApi = ({ attachments = [], tlm, ts, _updatedAt, ...message }: Serialized<IMessage>): IMessage => ({
	...message,
	ts: new Date(ts),
	...(tlm && { tlm: new Date(tlm) }),
	_updatedAt: new Date(_updatedAt),
	attachments: attachments.map(({ ts, ...attachment }) => ({
		...(ts && { ts: new Date(ts) }),
		...attachment,
	})),
});
