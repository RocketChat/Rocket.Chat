import { isOmnichannelRoom, type IRoom, type ISubscription } from '@rocket.chat/core-typings';
import { memo } from 'react';

import Favorite from './Favorite';
import RoomHeaderCategoryMenu from './RoomHeaderCategoryMenu';
import { useHasLicenseModule } from '../../../../hooks/useHasLicenseModule';
import { useUserIsSubscribed } from '../../contexts/RoomContext';

const RoomGroupingMenu = ({ room }: { room: IRoom & { f?: ISubscription['f']; category?: ISubscription['category'] } }) => {
	const subscribed = useUserIsSubscribed();
	const { data: hasLicenseModule = false } = useHasLicenseModule('experimental-enterprise-features');

	if (!subscribed) {
		return null;
	}

	if (hasLicenseModule && !isOmnichannelRoom(room)) {
		return <RoomHeaderCategoryMenu room={room} />;
	}

	return <Favorite room={room} />;
};

export default memo(RoomGroupingMenu);
