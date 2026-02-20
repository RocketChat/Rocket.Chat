import type { CallHistoryItem, IExternalMediaCallHistoryItem, IMediaCall, Serialized } from '@rocket.chat/core-typings';
import { CallHistoryContextualBar, useMediaCallContext } from '@rocket.chat/ui-voip';
import { useMemo } from 'react';

type ExternalCallEndpointData = Serialized<{
	item: IExternalMediaCallHistoryItem;
	call: IMediaCall;
}>;

type MediaCallHistoryExternalProps = {
	data: ExternalCallEndpointData;
	onClose: () => void;
};

const getContact = (item: ExternalCallEndpointData['item']) => {
	return {
		number: item.contactExtension,
	};
};

export const isExternalCallHistoryItem = (data: { item: Serialized<CallHistoryItem> }): data is ExternalCallEndpointData => {
	return 'external' in data.item && data.item.external;
};

const MediaCallHistoryExternal = ({ data, onClose }: MediaCallHistoryExternalProps) => {
	const contact = useMemo(() => getContact(data.item), [data]);
	const historyData = useMemo(() => {
		return {
			callId: data.call._id,
			direction: data.item.direction,
			duration: data.item.duration,
			startedAt: new Date(data.item.ts),
			state: data.item.state,
		};
	}, [data]);
	const { onToggleWidget } = useMediaCallContext();

	const actions = useMemo(() => {
		if (!onToggleWidget) {
			return {};
		}
		return {
			voiceCall: () => onToggleWidget(contact),
		};
	}, [contact, onToggleWidget]);

	return <CallHistoryContextualBar onClose={onClose} actions={actions} contact={contact} data={historyData} />;
};

export default MediaCallHistoryExternal;
