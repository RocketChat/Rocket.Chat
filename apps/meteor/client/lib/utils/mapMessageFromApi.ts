import type { IDiscussionMessage, IEditedMessage, IMessage, Serialized } from '@rocket.chat/core-typings';

type MappableMessage = IMessage & Partial<Pick<IEditedMessage, 'editedAt' | 'editedBy'>> & Partial<Pick<IDiscussionMessage, 'dlm'>>;

export const mapMessageFromApi = <T extends MappableMessage = IMessage>({
	attachments,
	tlm,
	ts,
	_updatedAt,
	pinnedAt,
	webRtcCallEndTs,
	editedAt,
	dlm,
	...message
}: Serialized<T>): T =>
	({
		...message,
		ts: new Date(ts),
		...(tlm && { tlm: new Date(tlm) }),
		_updatedAt: new Date(_updatedAt),
		...(pinnedAt && { pinnedAt: new Date(pinnedAt) }),
		...(webRtcCallEndTs && { webRtcCallEndTs: new Date(webRtcCallEndTs) }),
		...(attachments && {
			attachments: attachments.map(({ ts, ...attachment }) => ({
				...(ts && { ts: new Date(ts) }),
				...attachment,
			})),
		}),
		...(editedAt && { editedAt: new Date(editedAt) }),
		...(dlm && { dlm: new Date(dlm) }),
	}) as unknown as T;
