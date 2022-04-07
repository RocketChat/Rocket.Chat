import { IMessage } from '../../../definition/IMessage';
import { Serialized } from '../../../definition/Serialized';

export const mapMessageFromApi = ({
	attachments = [],
	tlm,
	ts,
	_updatedAt,
	webRtcCallEndTs,
	...message
}: Serialized<IMessage>): IMessage => ({
	...message,
	ts: new Date(ts),
	...(tlm && { tlm: new Date(tlm) }),
	_updatedAt: new Date(_updatedAt),
	...(webRtcCallEndTs && { webRtcCallEndTs: new Date(webRtcCallEndTs) }),
	attachments: attachments.map(({ ts, ...attachment }) => ({
		...(ts && { ts: new Date(ts) }),
		...attachment,
	})),
});
