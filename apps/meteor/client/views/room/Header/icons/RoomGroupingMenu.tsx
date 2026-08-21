import { isOmnichannelRoom, type IRoom, type ISubscription } from '@rocket.chat/core-typings';
import { memo } from 'react';

import Favorite from './Favorite';
import RoomHeaderCategoryMenu from './RoomHeaderCategoryMenu';
import { useCustomCategories } from '../../../../sidebar/hooks/useCustomCategories';

const RoomGroupingMenu = ({ room }: { room: IRoom & { f?: ISubscription['f']; category?: ISubscription['category'] } }) => {
	const { hasLicenseModule } = useCustomCategories();

	if (hasLicenseModule && !isOmnichannelRoom(room)) {
		return <RoomHeaderCategoryMenu room={room} />;
	}

	return <Favorite room={room} />;
};

export default memo(RoomGroupingMenu);
