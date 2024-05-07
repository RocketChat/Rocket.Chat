import type { IOmnichannelRoom, IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { Icon } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactElement } from 'react';
import React, { isValidElement } from 'react';

import { useRoomIcon } from '../../hooks/useRoomIcon';
import { OmnichannelRoomIcon } from './OmnichannelRoomIcon';

export const RoomIcon = ({
	room,
	size = 'x16',
	isIncomingCall,
	placement = 'default',
}: {
	room: Pick<IRoom, 't' | 'prid' | 'teamMain' | 'uids' | 'u'>;
	size?: ComponentProps<typeof Icon>['size'];
	isIncomingCall?: boolean;
	placement?: 'sidebar' | 'default';
}): ReactElement | null => {
	const iconPropsOrReactNode = useRoomIcon(room);

	if (isIncomingCall) {
		return <Icon name='phone' size={size} />;
	}

	if (isOmnichannelRoom(room as IRoom)) {
		return <OmnichannelRoomIcon placement={placement} room={room as IOmnichannelRoom} size={size} />;
	}

	if (isValidElement<any>(iconPropsOrReactNode)) {
		return iconPropsOrReactNode;
	}

	if (!iconPropsOrReactNode) {
		return null;
	}

	return <Icon {...iconPropsOrReactNode} size={size} />;
};
