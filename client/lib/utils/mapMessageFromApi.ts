import { IMessage } from '../../../definition/IMessage';
import { Serialized } from '../../../definition/Serialized';

export const mapMessageFromApi = ({ attachments = [], tlm, ts, _updatedAt, editedAt, ...message }: Serialized<IMessage>): IMessage => ({
	...message,
	ts: new Date(ts),
	...(tlm && { tlm: new Date(tlm) }),
	...(editedAt && { editedAt: new Date(editedAt) }),
	_updatedAt: new Date(_updatedAt),
	attachments: attachments.map(({ ts, ...attachment }) => ({
		...(ts && { ts: new Date(ts) }),
		...attachment,
	})),
});
