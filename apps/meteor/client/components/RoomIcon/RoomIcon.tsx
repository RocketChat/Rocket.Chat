import type { IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import type { IconProps } from '@rocket.chat/fuselage';
import { Icon } from '@rocket.chat/fuselage';
import { isValidElement } from 'react';

import { OmnichannelRoomIcon } from './OmnichannelRoomIcon';
import { useRoomIcon } from '../../hooks/useRoomIcon';

export type RoomIconProps = {
	room: Pick<IRoom, 't' | 'prid' | 'teamMain' | 'uids' | 'u'>;
	size?: IconProps['size'];
	isIncomingCall?: boolean;
	placement?: 'sidebar' | 'default';
};

export const RoomIcon = ({ room, size = 'x16', isIncomingCall, placement = 'default' }: RoomIconProps) => {
	const iconPropsOrReactNode = useRoomIcon(room);

	if (isIncomingCall) {
		return <Icon name='phone' size={size} />;
	}

	if (isOmnichannelRoom(room)) {
		return <OmnichannelRoomIcon placement={placement} source={room.source} status={room.v?.status} size={size} />;
	}

	if (isValidElement<any>(iconPropsOrReactNode)) {
		return iconPropsOrReactNode;
	}

	if (!iconPropsOrReactNode) {
		return null;
	}

	return <Icon {...iconPropsOrReactNode} size={size} />;
};
