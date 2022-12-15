import { Header } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import React, { useMemo } from 'react';

import type { IRoomWithFederationOriginalName } from '../contexts/RoomContext';

type FederatedRoomProps = {
	room: IRoomWithFederationOriginalName;
};

const FederatedRoomOriginServer = ({ room }: FederatedRoomProps): ReactElement | null => {
	const originServerName = useMemo(() => room.federationOriginalName?.split(':')[1], [room.federationOriginalName]);
	if (!originServerName) {
		return null;
	}
	return (
		<Header.Tag>
			<>
				<Header.Tag.Icon icon={{ name: 'globe' }} />
				{originServerName}
			</>
		</Header.Tag>
	);
};

export default FederatedRoomOriginServer;
