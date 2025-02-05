import { Box } from '@rocket.chat/fuselage';
import { Header, HeaderToolbar } from '@rocket.chat/ui-client';
import { useLayout } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import RoomLayout from './layout/RoomLayout';
import NotFoundState from '../../components/NotFoundState';
import SidebarToggler from '../../components/SidebarToggler';

const RoomNotFound = (): ReactElement => {
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
					<NotFoundState title={t('Room_not_found')} subtitle={t('Room_not_exist_or_not_permission')} />
				</Box>
			}
		/>
	);
};

export default RoomNotFound;
