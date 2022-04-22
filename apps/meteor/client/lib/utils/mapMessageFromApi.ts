import type { IMessage } from '@rocket.chat/core-typings';
import { Serialized } from '@rocket.chat/core-typings';

export const mapMessageFromApi = ({
	attachments = [],
	tlm,
	ts,
	_updatedAt,
	webRtcCallEndTs,
	editedAt,
	...message
}: Serialized<IMessage>): IMessage => ({
	...message,
	ts: new Date(ts),
	...(tlm && { tlm: new Date(tlm) }),
	...(editedAt && { editedAt: new Date(editedAt) }),
	_updatedAt: new Date(_updatedAt),
	...(webRtcCallEndTs && { webRtcCallEndTs: new Date(webRtcCallEndTs) }),
	attachments: attachments.map(({ ts, ...attachment }) => ({
		...(ts && { ts: new Date(ts) }),
		...attachment,
	})),
});
