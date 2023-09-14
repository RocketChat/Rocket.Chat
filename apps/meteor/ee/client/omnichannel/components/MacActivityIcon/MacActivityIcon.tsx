import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

type MacActivityIconProps = {
	visitor: IOmnichannelRoom['v'];
};

const isRoomActive = (_: IOmnichannelRoom['v']): boolean => {
	return false;
};

export const MacActivityIcon = ({ visitor }: MacActivityIconProps): ReactElement | null => {
	const t = useTranslation();
	const isActive = isRoomActive(visitor);

	return !isActive ? (
		<Icon name='warning' verticalAlign='middle' size='x20' color='danger' title={t('Workspace_exceeded_MAC_limit_disclaimer')} />
	) : null;
};
