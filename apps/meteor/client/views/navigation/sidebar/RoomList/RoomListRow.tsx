import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useVideoConfAcceptCall, useVideoConfRejectIncomingCall, useVideoConfIncomingCalls } from '@rocket.chat/ui-video-conf';
import type { TFunction } from 'i18next';
import { memo, useMemo } from 'react';

import SidebarItemWithData from './SidebarItemWithData';

type RoomListRowProps = {
	data: {
		t: TFunction;
		openedRoom: string;
		isAnonymous: boolean;
	};
	item: SubscriptionWithRoom;
	/** The sidebar group this row belongs to (system filter key or custom category id). */
	groupKey?: string;
	isCustomCategory?: boolean;
};

const RoomListRow = ({ data, item, groupKey, isCustomCategory }: RoomListRowProps) => {
	const { t } = data;

	const acceptCall = useVideoConfAcceptCall();
	const rejectCall = useVideoConfRejectIncomingCall();
	const incomingCalls = useVideoConfIncomingCalls();
	const currentCall = incomingCalls.find((call) => call.rid === item.rid);

	const videoConfActions = useMemo(
		() =>
			currentCall && {
				acceptCall: (): void => acceptCall(currentCall.callId),
				rejectCall: (): void => rejectCall(currentCall.callId),
			},
		[acceptCall, rejectCall, currentCall],
	);

	return (
		<SidebarItemWithData t={t} room={item} videoConfActions={videoConfActions} groupKey={groupKey} isCustomCategory={isCustomCategory} />
	);
};

export default memo(RoomListRow);
