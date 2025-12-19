import type { CallHistoryItem, IInternalMediaCallHistoryItem, IMediaCall, Serialized } from '@rocket.chat/core-typings';
import { CallHistoryContextualBar } from '@rocket.chat/ui-voip';
import { useMemo } from 'react';

import { useMediaCallInternalHistoryActions } from './useMediaCallInternalHistoryActions';

type InternalCallEndpointData = Serialized<{
	item: IInternalMediaCallHistoryItem;
	call: IMediaCall;
}>;

type MediaCallHistoryInternalProps = {
	data: InternalCallEndpointData;
	onClose: () => void;
	openUserInfo?: (userId: string, rid: string) => void;
	openRoomId?: string;
	messageRoomId?: string;
};

export const isInternalCallHistoryItem = (data: { item: Serialized<CallHistoryItem> }): data is InternalCallEndpointData => {
	return 'external' in data.item && !data.item.external;
};

const getContact = (item: InternalCallEndpointData['item'], call: InternalCallEndpointData['call']) => {
	const { caller, callee } = call ?? {};
	const contact = caller?.id === item.contactId ? caller : callee;
	const { id, sipExtension, username, ...rest } = contact;
	return {
		...rest,
		_id: id,
		username: username ?? '',
		voiceCallExtension: sipExtension,
	};
};

const MediaCallHistoryInternal = ({ data, onClose, openUserInfo, openRoomId, messageRoomId }: MediaCallHistoryInternalProps) => {
	const contact = useMemo(() => getContact(data.item, data.call), [data]);
	const historyData = useMemo(() => {
		return {
			callId: data.call._id,
			direction: data.item.direction,
			duration: data.item.duration,
			startedAt: new Date(data.item.ts),
			state: data.item.state,
		};
	}, [data]);

	const rid = messageRoomId || data.item.rid;

	const actions = useMediaCallInternalHistoryActions({
		contact,
		messageId: data.item.messageId,
		openRoomId,
		messageRoomId: rid,
		openUserInfo: openUserInfo && rid ? (userId: string) => openUserInfo(userId, rid) : undefined,
	});

	return <CallHistoryContextualBar onClose={onClose} actions={actions} contact={contact} data={historyData} />;
};

export default MediaCallHistoryInternal;
