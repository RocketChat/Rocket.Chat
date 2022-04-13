import { IOmnichannelRoom, isOmnichannelRoomFromAppSource } from '@rocket.chat/core-typings';
import { Icon } from '@rocket.chat/fuselage';
import React, { ComponentProps, ReactElement } from 'react';

import { OmnichannelAppSourceRoomIcon } from './OmnichannelAppSourceRoomIcon';
import { OmnichannelCoreSourceRoomIcon } from './OmnichannelCoreSourceRoomIcon';

export const OmnichannelRoomIcon = ({
	room,
	size,
	placement = 'default',
}: {
	room: IOmnichannelRoom;
	size: ComponentProps<typeof Icon>['size'];
	placement: 'sidebar' | 'default';
}): ReactElement => {
	if (isOmnichannelRoomFromAppSource(room)) {
		return <OmnichannelAppSourceRoomIcon placement={placement} room={room} size={size} />;
	}
	return <OmnichannelCoreSourceRoomIcon room={room} size={size} />;
};
