import { memo } from 'react';

import type { RoomGroupingButtonProps } from './RoomGroupingButton';
import RoomGroupingButton from './RoomGroupingButton';
import { useUserIsSubscribed } from '../../contexts/RoomContext';

const RoomGroupingMenu = ({ room }: RoomGroupingButtonProps) => {
	const subscribed = useUserIsSubscribed();

	if (!subscribed) {
		return null;
	}

	return <RoomGroupingButton room={room} />;
};

export default memo(RoomGroupingMenu);
