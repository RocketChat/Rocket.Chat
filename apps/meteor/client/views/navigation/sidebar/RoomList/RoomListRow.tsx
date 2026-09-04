import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useVideoConfAcceptCall, useVideoConfRejectIncomingCall, useVideoConfIncomingCalls } from '@rocket.chat/ui-video-conf';
import type { TFunction } from 'i18next';
import { memo, useMemo } from 'react';

import SidebarItemWithData from './SidebarItemWithData';
import { useConferenceWindowEnabled } from '../../../conference/hooks/useConferenceWindowEnabled';

export type RoomListRowProps = {
	data: {
		t: TFunction;
		openedRoom: string;
		isAnonymous: boolean;
	};
	item: SubscriptionWithRoom;
};

const RoomListRow = ({ data, item }: RoomListRowProps) => {
	const { t } = data;

	const acceptCall = useVideoConfAcceptCall();
	const rejectCall = useVideoConfRejectIncomingCall();
	const incomingCalls = useVideoConfIncomingCalls();
	const conferenceWindowEnabled = useConferenceWindowEnabled();
	const currentCall = incomingCalls.find((call) => call.rid === item.rid);

	// The same rule as the sidebar this one is replacing: with the call window, a ringing call is answered from
	// the list of calls already running rather than from the row for its room, so the row keeps no accept/reject
	// of its own. Nothing renders this yet — which is exactly why it is easy to leave behind.
	const videoConfActions = useMemo(
		() =>
			!conferenceWindowEnabled && currentCall
				? {
						acceptCall: (): void => acceptCall(currentCall.callId),
						rejectCall: (): void => rejectCall(currentCall.callId),
					}
				: undefined,
		[acceptCall, rejectCall, currentCall, conferenceWindowEnabled],
	);

	return <SidebarItemWithData t={t} room={item} videoConfActions={videoConfActions} />;
};

export default memo(RoomListRow);
