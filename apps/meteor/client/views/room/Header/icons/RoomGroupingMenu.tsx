import { isOmnichannelRoom, type IRoom, type ISubscription } from '@rocket.chat/core-typings';
import { memo } from 'react';

import Favorite from './Favorite';
import RoomHeaderCategoryMenu from './RoomHeaderCategoryMenu';
import { useIsEnterprise } from '../../../../hooks/useIsEnterprise';
import { useUserIsSubscribed } from '../../contexts/RoomContext';

const RoomGroupingMenu = ({ room }: { room: IRoom & { f?: ISubscription['f']; category?: ISubscription['category'] } }) => {
	const subscribed = useUserIsSubscribed();
	const { data: { isEnterprise = false } = {} } = useIsEnterprise();

	if (!subscribed) {
		return null;
	}

	if (isEnterprise && !isOmnichannelRoom(room)) {
		return <RoomHeaderCategoryMenu room={room} />;
	}

	return <Favorite room={room} />;
};

export default memo(RoomGroupingMenu);
