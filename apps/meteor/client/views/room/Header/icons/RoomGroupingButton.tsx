import { isOmnichannelRoom, type IRoom, type ISubscription } from '@rocket.chat/core-typings';
import { memo } from 'react';

import Favorite from './Favorite';
import RoomHeaderCategoryMenu from './RoomHeaderCategoryMenu';
import { useIsEnterprise } from '../../../../hooks/useIsEnterprise';

export type RoomGroupingButtonProps = { room: IRoom & { f?: ISubscription['f']; category?: ISubscription['category'] } };

/** Where the room sits in the sidebar: picks its category under the custom categories license, or toggles favorite without it. */
const RoomGroupingButton = ({ room }: RoomGroupingButtonProps) => {
	const { data: { isEnterprise = false } = {} } = useIsEnterprise();

	if (isEnterprise && !isOmnichannelRoom(room)) {
		return <RoomHeaderCategoryMenu room={room} />;
	}

	return <Favorite room={room} />;
};

export default memo(RoomGroupingButton);
