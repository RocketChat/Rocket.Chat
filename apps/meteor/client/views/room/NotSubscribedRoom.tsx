import type { IRoom } from '@rocket.chat/core-typings';
import { Box, States, StatesAction, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn, Header, HeaderToolbar } from '@rocket.chat/ui-client';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import RoomLayout from './layout/RoomLayout';
import { SidebarTogglerV2 } from '../../components/SidebarTogglerV2';
import { useJoinRoom } from '../../hooks/useJoinRoom';

type NotSubscribedRoomProps = {
	rid: IRoom['_id'];
	reference: string;
	type: IRoom['t'];
};

const NotSubscribedRoom = ({ rid, reference, type }: NotSubscribedRoomProps): ReactElement => {
	const { t } = useTranslation();

	const handleJoinClick = useJoinRoom();

	const { isMobile } = useLayout();

	return (
		<RoomLayout
			header={
				isMobile && (
					<FeaturePreview feature='newNavigation'>
						<FeaturePreviewOff>
							<Header justifyContent='start'>
								<HeaderToolbar>
									<SidebarTogglerV2 />
								</HeaderToolbar>
							</Header>
						</FeaturePreviewOff>
						<FeaturePreviewOn>{null}</FeaturePreviewOn>
					</FeaturePreview>
				)
			}
			body={
				<Box display='flex' justifyContent='center' height='full'>
					<States>
						<StatesIcon name='add-user' />
						<StatesTitle>{t('Channel_not_joined')}</StatesTitle>
						<StatesSubtitle>
							<Box display='block'>
								<Trans
									i18nKey='Join_channel_to_view_history'
									values={{ channel: reference }}
									components={{ b: <Box is='span' fontWeight={600} /> }}
								/>
							</Box>
						</StatesSubtitle>
						<Box mbs={16}>
							<StatesActions>
								<StatesAction disabled={handleJoinClick.isPending} onClick={() => handleJoinClick.mutate({ rid, reference, type })}>
									{t('Join_channel')}
								</StatesAction>
							</StatesActions>
						</Box>
					</States>
				</Box>
			}
		/>
	);
};

export default NotSubscribedRoom;
