import { IRoom, isOmnichannelRoom } from '@rocket.chat/core-typings';
import { Icon } from '@rocket.chat/fuselage';
import React, { ComponentProps, ReactElement, isValidElement } from 'react';

import { useRoomIcon } from '../../hooks/useRoomIcon';
import { OmnichannelRoomIcon } from './OmnichannelRoomIcon';

export const RoomIcon = ({
	room,
	size = 'x16',
	placement,
}: {
	room: IRoom;
	size?: ComponentProps<typeof Icon>['size'];
	placement: 'sidebar' | 'default';
}): ReactElement | null => {
	const iconPropsOrReactNode = useRoomIcon(room);

	if (isOmnichannelRoom(room)) {
		return <OmnichannelRoomIcon placement={placement} room={room} size={size} />;
	}

	if (isValidElement(iconPropsOrReactNode)) {
		return iconPropsOrReactNode;
	}

	if (!iconPropsOrReactNode) {
		return null;
	}

	return <Icon {...iconPropsOrReactNode} size={size} />;
};
