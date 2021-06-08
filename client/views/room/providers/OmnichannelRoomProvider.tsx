import React, { ReactNode, useMemo } from 'react';

import { IOmnichannelRoom } from '../../../../definition/IRoom';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { OmnichannelRoomContext } from '../contexts/OmnichannelRoomContext';

export type Props = {
	children: ReactNode;
	room: IOmnichannelRoom;
};

const OmnichannelRoomProvider = ({ room, children }: Props): JSX.Element => {
	const { value /* phase, reload */ } = useEndpointData('livechat/visitors.info');

	const contextValue = useMemo(
		() => ({
			rid: room._id,
			visitor: room.v,
			visitorInfo: value?.visitor,
		}),
		[room._id, room.v, value?.visitor],
	);

	console.log('provider', room);

	return (
		<OmnichannelRoomContext.Provider
			value={contextValue}
			children={children}
		></OmnichannelRoomContext.Provider>
	);
};
export default OmnichannelRoomProvider;
