import { useUserId } from '@rocket.chat/ui-contexts';
import React, { memo, ReactElement, ComponentProps } from 'react';

import { usePresence } from '../../hooks/usePresence';
import RoomAvatar from './RoomAvatar';

const DirectRoomAvatar = ({ room, ...rest }: ComponentProps<typeof RoomAvatar>): ReactElement => {
	const ownId = useUserId();
	const otherId = room.uids?.find((uid) => uid !== ownId);
	const presence = usePresence(otherId || ownId || '');

	return <RoomAvatar room={{ ...room, avatarETag: presence?.avatarETag }} {...rest} />;
};

export default memo(DirectRoomAvatar);
