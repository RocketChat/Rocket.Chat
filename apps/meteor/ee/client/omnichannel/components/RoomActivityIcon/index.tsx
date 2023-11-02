import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useIsRoomOverMacLimit } from '../../../../../client/hooks/omnichannel/useIsRoomOverMacLimit';

type RoomActivityIconProps = {
	room: IOmnichannelRoom;
};

export const RoomActivityIcon = ({ room }: RoomActivityIconProps): ReactElement | null => {
	const t = useTranslation();
	const isRoomOverMacLimit = useIsRoomOverMacLimit(room);

	return isRoomOverMacLimit ? (
		<Icon name='warning' verticalAlign='middle' size='x20' color='danger' title={t('Workspace_exceeded_MAC_limit_disclaimer')} />
	) : null;
};
