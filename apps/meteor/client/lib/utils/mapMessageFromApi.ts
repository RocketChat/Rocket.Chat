import type { IMessage } from '@rocket.chat/core-typings';
import { Serialized } from '@rocket.chat/core-typings';
import { Root } from '@rocket.chat/message-parser';

export const mapMessageFromApi = ({ attachments, tlm, ts, _updatedAt, webRtcCallEndTs, ...message }: Serialized<IMessage>): IMessage => ({
	...message,
	ts: new Date(ts),
	...(tlm && { tlm: new Date(tlm) }),
	_updatedAt: new Date(_updatedAt),
	...(webRtcCallEndTs && { webRtcCallEndTs: new Date(webRtcCallEndTs) }),
	...(attachments && {
		attachments: attachments.map(({ ts, md, ...attachment }) => ({
			...(ts && { ts: new Date(ts) }),
			...(md && { md: md as Root }),
			...attachment,
		})),
	}),
});
