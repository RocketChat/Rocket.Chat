import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

type MacActivityIconProps = {
	room: IOmnichannelRoom;
};

const isRoomActive = (_: IOmnichannelRoom): boolean => {
	return false;
};

export const MacActivityIcon = ({ room }: MacActivityIconProps) => {
	const t = useTranslation();
	const isActive = isRoomActive(room);

	return !isActive ? (
		<Icon name='warning' verticalAlign='middle' size='x20' color='danger' title={t('Workspace_exceeded_MAC_limit_disclaimer')} />
	) : null;
};
