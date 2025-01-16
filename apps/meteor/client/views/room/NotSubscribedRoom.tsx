import type { IRoom } from '@rocket.chat/core-typings';
import { Box, States, StatesAction, StatesActions, StatesIcon, StatesSubtitle, StatesTitle } from '@rocket.chat/fuselage';
import { Header, HeaderToolbar } from '@rocket.chat/ui-client';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import RoomLayout from './layout/RoomLayout';
import SidebarToggler from '../../components/SidebarToggler';
import { useJoinRoom } from '../../hooks/useJoinRoom';

type NotSubscribedRoomProps = {
	rid: IRoom['_id'];
	reference: string;
	type: IRoom['t'];
};

const NotSubscribedRoom = ({ rid, reference, type }: NotSubscribedRoomProps): ReactElement => {
	const { t } = useTranslation();

	const handleJoinClick = useJoinRoom();
	// TODO: Handle onJoinClick error

	const { isMobile } = useLayout();

	return (
		<RoomLayout
			header={
				isMobile && (
					<Header justifyContent='start'>
						<HeaderToolbar>
							<SidebarToggler />
						</HeaderToolbar>
					</Header>
				)
			}
			body={
				<Box display='flex' justifyContent='center' height='full'>
					<States>
						<StatesIcon name='hash' />
						<StatesTitle>{t('You_are_not_part_of_the_channel')}</StatesTitle>
						<StatesSubtitle>{t('You_need_to_join_this_channel')}</StatesSubtitle>
						<Box mbs={16}>
							<StatesActions>
								<StatesAction disabled={handleJoinClick.isPending} onClick={() => handleJoinClick.mutate({ rid, reference, type })}>
									{t('Join_Chat')}
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
