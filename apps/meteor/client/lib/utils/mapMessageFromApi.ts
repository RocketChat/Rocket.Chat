import type { IMessage, Serialized } from '@rocket.chat/core-typings';

export const mapMessageFromApi = ({
	attachments,
	tlm,
	ts,
	_updatedAt,
	pinnedAt,
	webRtcCallEndTs,
	...message
}: Serialized<IMessage>): IMessage => ({
	...message,
	ts: new Date(ts),
	...(tlm && { tlm: new Date(tlm) }),
	_updatedAt: new Date(_updatedAt),
	...(pinnedAt && { pinnedAt: new Date(pinnedAt) }),
	...(webRtcCallEndTs && { webRtcCallEndTs: new Date(webRtcCallEndTs) }),
	...(attachments && {
		attachments: attachments.map(({ ts, ...attachment }) => ({
			...(ts && { ts: new Date(ts) }),
			...(attachment as any),
		})),
	}),
});
