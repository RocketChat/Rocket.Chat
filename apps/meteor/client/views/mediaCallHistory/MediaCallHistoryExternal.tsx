import type { CallHistoryItem, IInternalMediaCallHistoryItem, IMediaCall, Serialized } from '@rocket.chat/core-typings';
import {
	CallHistoryContextualBar,
	useWidgetExternalControls,
	usePeekMediaSessionState,
	type CallHistoryExternalContact,
	type CallHistoryUnknownContact,
} from '@rocket.chat/ui-voip';
import { useMemo } from 'react';

type ExternalCallEndpointData = Serialized<{
	item: Exclude<CallHistoryItem, IInternalMediaCallHistoryItem>;
	call?: IMediaCall;
}>;

type MediaCallHistoryExternalProps = {
	data: ExternalCallEndpointData;
	onClose: () => void;
};

export const getExternalContact = (item: ExternalCallEndpointData['item']): CallHistoryExternalContact | CallHistoryUnknownContact => {
	if (item.type === 'media-call') {
		return {
			number: item.contactExtension,
		};
	}

	return { unknown: true };
};

export const isExternalCallHistoryItem = (data: { item: Serialized<CallHistoryItem> }): data is ExternalCallEndpointData => {
	return data.item.type !== 'media-call' || data.item.external;
};

const MediaCallHistoryExternal = ({ data, onClose }: MediaCallHistoryExternalProps) => {
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
	const state = usePeekMediaSessionState();
	const { toggleWidget } = useWidgetExternalControls();

	const actions = useMemo(() => {
		if (state !== 'available') {
			return {};
		}
		return {
			voiceCall: () => toggleWidget(contact),
		};
	}, [contact, state, toggleWidget]);

	return <CallHistoryContextualBar onClose={onClose} actions={actions} contact={contact} data={historyData} />;
};

export default MediaCallHistoryExternal;
