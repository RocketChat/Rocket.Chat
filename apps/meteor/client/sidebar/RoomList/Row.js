import { SidebarSection } from '@rocket.chat/fuselage';
import React, { memo, useMemo } from 'react';

import { useAcceptCall, useRejectIncomingCall, useIncomingCalls } from '../../contexts/VideoConfContext';
import OmnichannelSection from '../sections/OmnichannelSection';
import SideBarItemTemplateWithData from './SideBarItemTemplateWithData';

const sections = {
	Omnichannel: OmnichannelSection,
};

const Row = ({ data, item }) => {
	const { extended, t, SideBarItemTemplate, AvatarTemplate, openedRoom, sidebarViewMode } = data;

	const acceptCall = useAcceptCall();
	const rejectCall = useRejectIncomingCall();
	const incomingCalls = useIncomingCalls();
	const currentCall = incomingCalls.find((call) => call.rid === item.rid);

	const videoConfActions = useMemo(
		() => ({
			acceptCall: () => acceptCall(currentCall.callId),
			rejectCall: () => rejectCall(currentCall.callId),
		}),
		[acceptCall, rejectCall, currentCall],
	);

	if (typeof item === 'string') {
		const Section = sections[item];
		return Section ? (
			<Section aria-level='1' />
		) : (
			<SidebarSection aria-level='1'>
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
			videoConfActions={currentCall && videoConfActions}
		/>
	);
};

export default memo(Row);
