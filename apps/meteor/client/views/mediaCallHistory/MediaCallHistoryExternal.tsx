import type { CallHistoryItem, IInternalMediaCallHistoryItem, IMediaCall, Serialized } from '@rocket.chat/core-typings';
import { CallHistoryContextualBar, type CallHistoryExternalContact, type CallHistoryUnknownContact } from '@rocket.chat/ui-voip';
import { useMemo } from 'react';

import { useMediaCallExternalHistoryActions } from './useMediaCallExternalHistoryActions';

type ExternalCallEndpointData = Serialized<{
	item: Exclude<CallHistoryItem, IInternalMediaCallHistoryItem>;
	call?: IMediaCall;
}>;

export type MediaCallHistoryExternalProps = {
	data: ExternalCallEndpointData;
	onClose: () => void;
	openUserInfo?: (userId: string) => void;
};

export const getExternalContact = (item: ExternalCallEndpointData['item']): CallHistoryExternalContact | CallHistoryUnknownContact => {
	if (item.type === 'media-call') {
		return {
			number: item.contactExtension,
		};
	}

	const optionalData = {
		...(item.contactId && { uid: item.contactId }),
		...(item.contactUsername && { username: item.contactUsername }),
	};

	if (item.contactNumber) {
		return {
			...optionalData,
			number: item.contactNumber,
			name: item.contactName,
		};
	}

	if (item.contactName) {
		return {
			...optionalData,
			name: item.contactName,
		};
	}

	return { unknown: true };
};

export const isExternalCallHistoryItem = (data: { item: Serialized<CallHistoryItem> }): data is ExternalCallEndpointData => {
	return data.item.type !== 'media-call' || data.item.external;
};

const MediaCallHistoryExternal = ({ data, onClose, openUserInfo }: MediaCallHistoryExternalProps) => {
	const contact = useMemo(() => getExternalContact(data.item), [data]);
	const historyData = useMemo(() => {
		return {
			callId: data.item.callId,
			direction: data.item.direction,
			duration: data.item.duration,
			startedAt: new Date(data.item.ts),
			state: data.item.state,
		};
	}, [data]);

	const actions = useMediaCallExternalHistoryActions({
		contact,
		openUserInfo: openUserInfo ? (userId: string) => openUserInfo(userId) : undefined,
	});

	return <CallHistoryContextualBar onClose={onClose} actions={actions} contact={contact} data={historyData} />;
};

export default MediaCallHistoryExternal;
