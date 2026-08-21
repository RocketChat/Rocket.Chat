import { isOmnichannelRoom, type IRoom, type ISubscription } from '@rocket.chat/core-typings';
import { memo } from 'react';

import Favorite from './Favorite';
import RoomHeaderCategoryMenu from './RoomHeaderCategoryMenu';
import { useCustomCategories } from '../../../../sidebar/hooks/useCustomCategories';
import { useUserIsSubscribed } from '../../contexts/RoomContext';

const RoomGroupingMenu = ({ room }: { room: IRoom & { f?: ISubscription['f']; category?: ISubscription['category'] } }) => {
	const subscribed = useUserIsSubscribed();
	const { hasLicenseModule } = useCustomCategories();

	if (!subscribed) {
		return null;
	}

	if (hasLicenseModule && !isOmnichannelRoom(room)) {
		return <RoomHeaderCategoryMenu room={room} />;
	}

	return <Favorite room={room} />;
};

export default memo(RoomGroupingMenu);
