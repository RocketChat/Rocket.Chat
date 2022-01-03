import {
	SidebarItem,
	SidebarItemContent,
	// SidebarItemAvatar,
	SidebarItemSubtitle,
	SidebarItemWrapper,
	SidebarItemTitle,
	SidebarItemContainer,
	SidebarItemActions,
	SidebarItemAction,
	SidebarFooter,
	SidebarSection,
	SidebarSectionTitle,
	// TopBarAction,
} from '@rocket.chat/fuselage';
import React, { FC, ReactElement } from 'react';

import { useCallActions, useCallState } from '../../contexts/CallContext';
import { useTranslation } from '../../contexts/TranslationContext';

// import { useAvatarTemplate } from '../hooks/useAvatarTemplate';

const VoiceController: FC = (): ReactElement | null => {
	const t = useTranslation();
	const call = useCallState();

	const actions = useCallActions();

	if (call.state !== 'IN_CALL' && call.state !== 'OFFER_RECEIVED') {
		return null;
	}

	const subtitle = call.state === 'IN_CALL' ? t('In_progress') : t('Calling');

	return (
		<SidebarFooter elevated>
			<SidebarSection>
				<SidebarSectionTitle>{t('Phone_call')}</SidebarSectionTitle>
				{/* <SidebarItemActions>
					{muted ? (
						<TopBarAction icon='mic-off' onClick={toggleMic} />
					) : (
						<TopBarAction icon='mic' onClick={toggleMic} />
					)}
					{deafen ? (
						<TopBarAction icon='headphone-off' onClick={toggleDeafen} />
					) : (
						<TopBarAction icon='headphone' onClick={toggleDeafen} />
					)}
				</SidebarItemActions> */}
			</SidebarSection>
			<SidebarItem>
				{/* {room && roomAvatar && (
					<SidebarItemAvatar>{roomAvatar({ ...room, rid: room._id })}</SidebarItemAvatar>
				)} */}
				<SidebarItemContent>
					<SidebarItemContent>
						<SidebarItemWrapper>
							<SidebarItemTitle>{call.callerInfo.callerName}</SidebarItemTitle>
						</SidebarItemWrapper>
					</SidebarItemContent>
					<SidebarItemContent>
						<SidebarItemWrapper>
							<SidebarItemSubtitle className=''>{subtitle}</SidebarItemSubtitle>
							{/* TODO: Check if the required classname should be required in fuselage */}
						</SidebarItemWrapper>
					</SidebarItemContent>
				</SidebarItemContent>
				<SidebarItemContainer>
					<SidebarItemActions>
						{call.state === 'IN_CALL' && <SidebarItemAction icon='phone-off' danger primary onClick={actions.end} />}
						{call.state === 'OFFER_RECEIVED' && <SidebarItemAction icon='phone-off' danger primary onClick={actions.reject} />}
						{call.state === 'OFFER_RECEIVED' && <SidebarItemAction icon='phone' success primary onClick={actions.pickUp} />}
					</SidebarItemActions>
				</SidebarItemContainer>
			</SidebarItem>
		</SidebarFooter>
	);
};

export default VoiceController;
