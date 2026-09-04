import type { SubscriptionWithRoom } from '@rocket.chat/ui-contexts';
import { useVideoConfAcceptCall, useVideoConfRejectIncomingCall, useVideoConfIncomingCalls } from '@rocket.chat/ui-video-conf';
import type { TFunction } from 'i18next';
import { memo, useMemo } from 'react';

import SidebarItemTemplateWithData from './SidebarItemTemplateWithData';
import { useConferenceWindowEnabled } from '../../views/conference/hooks/useConferenceWindowEnabled';
import type { useAvatarTemplate } from '../hooks/useAvatarTemplate';
import type { useTemplateByViewMode } from '../hooks/useTemplateByViewMode';

export type RoomListRowProps = {
	data: {
		extended: boolean;
		t: TFunction;
		SidebarItemTemplate: ReturnType<typeof useTemplateByViewMode>;
		AvatarTemplate: ReturnType<typeof useAvatarTemplate>;
		openedRoom: string;
		sidebarViewMode: 'extended' | 'condensed' | 'medium';
		isAnonymous: boolean;
		userId?: string;
	};
	item: SubscriptionWithRoom;
};

const RoomListRow = ({ data, item }: RoomListRowProps) => {
	const { extended, t, SidebarItemTemplate, AvatarTemplate, openedRoom, sidebarViewMode, userId } = data;

	const acceptCall = useVideoConfAcceptCall();
	const rejectCall = useVideoConfRejectIncomingCall();
	const incomingCalls = useVideoConfIncomingCalls();
	const conferenceWindowEnabled = useConferenceWindowEnabled();
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
			AvatarTemplate={AvatarTemplate}
			videoConfActions={videoConfActions}
			userId={userId}
		/>
	);
};

export default memo(RoomListRow);
