import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { SidebarSection } from '@rocket.chat/fuselage';
import type { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo, useMemo } from 'react';

import { useVideoConfAcceptCall, useVideoConfRejectIncomingCall, useVideoConfIncomingCalls } from '../../contexts/VideoConfContext';
import type { useAvatarTemplate } from '../hooks/useAvatarTemplate';
import type { useTemplateByViewMode } from '../hooks/useTemplateByViewMode';
import SideBarItemTemplateWithData from './SideBarItemTemplateWithData';

type RoomListRowProps = {
	data: {
		extended: boolean;
		t: ReturnType<typeof useTranslation>;
		SideBarItemTemplate: ReturnType<typeof useTemplateByViewMode>;
		AvatarTemplate: ReturnType<typeof useAvatarTemplate>;
		openedRoom: string;
		sidebarViewMode: 'extended' | 'condensed' | 'medium';
		isAnonymous: boolean;
	};
	item: ISubscription & IRoom;
};

const RoomListRow = ({ data, item }: RoomListRowProps) => {
	const { extended, t, SideBarItemTemplate, AvatarTemplate, openedRoom, sidebarViewMode } = data;

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

	if (typeof item === 'string') {
		return (
			<SidebarSection>
				<SidebarSection.Title>{t(item)}</SidebarSection.Title>
			</SidebarSection>
		);
	}

	return (
		<SideBarItemTemplateWithData
			sidebarViewMode={sidebarViewMode}
			selected={item.rid === openedRoom}
			t={t}
			room={item}
			extended={extended}
			SideBarItemTemplate={SideBarItemTemplate}
			AvatarTemplate={AvatarTemplate}
			videoConfActions={videoConfActions}
		/>
	);
};

export default memo(RoomListRow);
