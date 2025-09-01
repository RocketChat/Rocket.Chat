import { SidebarV2 } from '@rocket.chat/fuselage';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import SidebarRoomList from './RoomList';
import SidebarFooter from '../../../sidebarv2/footer';
import BannerSection from '../../../sidebarv2/sections/BannerSection';

const Sidebar = () => {
	const { t } = useTranslation();

	return (
		<SidebarV2 aria-label={t('Sidebar')} className='rcx-sidebar--main rcx-sidebar'>
			<BannerSection />
			<SidebarRoomList />
			<SidebarFooter />
		</SidebarV2>
	);
};

export default memo(Sidebar);
