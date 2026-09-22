import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import {
	useVideoConfAcceptCall,
	useVideoConfIncomingCalls,
	useVideoConfRejectIncomingCall,
	useVideoConfWindowEnabled,
} from '@rocket.chat/ui-video-conf';
import type { TFunction } from 'i18next';
import { memo, useMemo } from 'react';

import SidebarItemTemplateWithData from './SidebarItemTemplateWithData';
import type { SidebarItemTemplate, SidebarRoomAvatar } from '../hooks/useSidebarPresentation';

export type RoomListRowProps = {
	data: {
		extended: boolean;
		t: TFunction;
		SidebarItemTemplate: SidebarItemTemplate;
		AvatarTemplate: SidebarRoomAvatar | null;
		formatTime: (time: string | Date | number) => string;
		openedRoom: string;
		sidebarViewMode: 'extended' | 'condensed' | 'medium';
		isAnonymous: boolean;
		userId?: string;
	};
	item: SubscriptionWithRoom;
};

const RoomListRow = ({ data, item }: RoomListRowProps) => {
	const { extended, t, SidebarItemTemplate, AvatarTemplate, openedRoom, sidebarViewMode, userId, formatTime } = data;

	const acceptCall = useVideoConfAcceptCall();
	const rejectCall = useVideoConfRejectIncomingCall();
	const incomingCalls = useVideoConfIncomingCalls();
	const conferenceWindowEnabled = useVideoConfWindowEnabled();
	const currentCall = incomingCalls.find((call) => call.rid === item.rid);

	// With the call window, a ringing call is answered from the list of the calls already running rather than
	// from the row for its room — so the row keeps no accept/reject of its own.
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

	return (
		<SidebarItemTemplateWithData
			sidebarViewMode={sidebarViewMode}
			selected={item.rid === openedRoom}
			t={t}
			room={item}
			extended={extended}
			SidebarItemTemplate={SidebarItemTemplate}
			formatTime={formatTime}
			AvatarTemplate={AvatarTemplate}
			videoConfActions={videoConfActions}
			userId={userId}
		/>
	);
};

export default memo(RoomListRow);
