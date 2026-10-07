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
import type { useAvatarTemplate } from '../hooks/useAvatarTemplate';
import type { SidebarAvatarSize, SidebarViewMode } from '../hooks/useSidebarDisplayPreferences';

export type RoomListRowProps = {
	data: {
		t: TFunction;
		AvatarTemplate: ReturnType<typeof useAvatarTemplate>;
		openedRoom: string;
		viewMode: SidebarViewMode;
		avatarSize?: SidebarAvatarSize;
		displayPreview: boolean;
		isAnonymous: boolean;
		userId?: string;
	};
	item: SubscriptionWithRoom;
};

const RoomListRow = ({ data, item }: RoomListRowProps) => {
	const { t, AvatarTemplate, openedRoom, viewMode, avatarSize, displayPreview, userId } = data;

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
			viewMode={viewMode}
			avatarSize={avatarSize}
			displayPreview={displayPreview}
			selected={item.rid === openedRoom}
			t={t}
			room={item}
			AvatarTemplate={AvatarTemplate}
			videoConfActions={videoConfActions}
			userId={userId}
		/>
	);
};

export default memo(RoomListRow);
