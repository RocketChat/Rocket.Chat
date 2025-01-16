import type { IRoom } from '@rocket.chat/core-typings';
import { Box } from '@rocket.chat/fuselage';
import { Header, HeaderToolbar } from '@rocket.chat/ui-client';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import RoomLayout from './layout/RoomLayout';
import NotSubscribedState from '../../components/NotSubscribedState';
import SidebarToggler from '../../components/SidebarToggler';

const NotSubscribedRoom = ({ rid, roomType }: { rid: IRoom['_id']; roomType: IRoom['t'] }): ReactElement => {
	const { t } = useTranslation();
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
					<NotSubscribedState
						title={t('You_are_not_part_of_the_channel')}
						subtitle={t('You_need_to_join_this_channel')}
						rid={rid}
						roomType={roomType}
					/>
				</Box>
			}
		/>
	);
};

export default NotSubscribedRoom;
