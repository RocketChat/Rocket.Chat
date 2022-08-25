import { useUserPreference } from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement } from 'react';

import { useEmbeddedLayout } from '../../../../hooks/useEmbeddedLayout';
import Announcement from '../../Announcement';
import { useRoom } from '../../contexts/RoomContext';
import { useTabBarAPI } from '../../providers/ToolboxProvider';
import BlazeTemplate from '../BlazeTemplate';

const RoomBody = (): ReactElement => {
	const isLayoutEmbedded = useEmbeddedLayout();
	const room = useRoom();
	const hideFlexTab = useUserPreference('hideFlexTab');
	const tabBar = useTabBarAPI();

	return (
		<>
			{!isLayoutEmbedded && room.announcement && <Announcement announcement={room.announcement} announcementDetails={undefined} />}
			<div className='main-content-flex'>
				<BlazeTemplate onClick={hideFlexTab ? tabBar.close : undefined} name='roomOld' tabBar={tabBar} rid={room._id} _id={room._id} />
			</div>
		</>
	);
};

export default memo(RoomBody);
