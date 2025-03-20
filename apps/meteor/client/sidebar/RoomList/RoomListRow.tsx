import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { SidebarSection } from '@rocket.chat/fuselage';
import { useVideoConfAcceptCall, useVideoConfRejectIncomingCall, useVideoConfIncomingCalls } from '@rocket.chat/ui-video-conf';
import type { TFunction } from 'i18next';
import type { ReactElement } from 'react';
import { memo, useMemo } from 'react';

import SideBarItemTemplateWithData from './SideBarItemTemplateWithData';
import type { useAvatarTemplate } from '../hooks/useAvatarTemplate';
import type { useTemplateByViewMode } from '../hooks/useTemplateByViewMode';

type RoomListRowProps = {
	extended: boolean;
	t: TFunction;
	SideBarItemTemplate: ReturnType<typeof useTemplateByViewMode>;
	AvatarTemplate: ReturnType<typeof useAvatarTemplate>;
	openedRoom: string;
	sidebarViewMode: 'extended' | 'condensed' | 'medium';
	isAnonymous: boolean;
};

const RoomListRow = ({ data, item }: { data: RoomListRowProps; item: ISubscription & IRoom }): ReactElement => {
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
