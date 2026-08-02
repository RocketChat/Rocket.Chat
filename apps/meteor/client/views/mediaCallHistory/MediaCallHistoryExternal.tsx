import type { CallHistoryItem, IExternalMediaCallHistoryItem, IMediaCall, Serialized } from '@rocket.chat/core-typings';
import {
	CallHistoryContextualBar,
	useWidgetExternalControls,
	usePeekMediaSessionState,
	type CallHistoryExternalContact,
} from '@rocket.chat/ui-voip';
import { useMemo } from 'react';

// Only the media-call variant is external-contact-shaped; a video-conference item has no `contactExtension`
// or `duration` to show here, so it's deliberately excluded rather than folded into this branch.
type ExternalCallEndpointData = Serialized<{
	item: IExternalMediaCallHistoryItem;
	call?: IMediaCall;
}>;

export type MediaCallHistoryExternalProps = {
	data: ExternalCallEndpointData;
	onClose: () => void;
};

export const getExternalContact = (item: ExternalCallEndpointData['item']): CallHistoryExternalContact => {
	return {
		number: item.contactExtension,
	};
};

export const isExternalCallHistoryItem = (data: { item: Serialized<CallHistoryItem> }): data is ExternalCallEndpointData => {
	return data.item.type === 'media-call' && data.item.external;
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
