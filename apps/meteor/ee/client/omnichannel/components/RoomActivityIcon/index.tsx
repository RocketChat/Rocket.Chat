import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { Icon } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useIsRoomActive } from '../../../../../client/hooks/omnichannel/useIsRoomActive';
import { useOmnichannel } from '../../../../../client/hooks/omnichannel/useOmnichannel';

type RoomActivityIconProps = {
	room: IOmnichannelRoom;
};

export const RoomActivityIcon = ({ room }: RoomActivityIconProps): ReactElement | null => {
	const t = useTranslation();
	const { isEnterprise } = useOmnichannel();
	const isRoomActive = useIsRoomActive(room);

	return isEnterprise && !isRoomActive ? (
		<Icon name='warning' verticalAlign='middle' size='x20' color='danger' title={t('Workspace_exceeded_MAC_limit_disclaimer')} />
	) : null;
};
