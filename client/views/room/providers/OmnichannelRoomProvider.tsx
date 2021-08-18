import React, { ReactNode, useMemo } from 'react';

import { IOmnichannelRoom } from '../../../../definition/IRoom';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { OmnichannelRoomContext } from '../contexts/OmnichannelRoomContext';

export type Props = {
	children: ReactNode;
	room: IOmnichannelRoom;
};

const OmnichannelRoomProvider = ({ room, children }: Props): JSX.Element => {
	const endpoint = `livechat/visitors.info?visitorId=${room.v._id}` as 'livechat/visitors.info';
	const { value /* phase, reload */ } = useEndpointData(endpoint);

	const contextValue = useMemo(
		() => ({
			rid: room._id,
			visitorId: room.v._id,
			visitorInfo: value?.visitor,
		}),
		[room._id, room.v._id, value?.visitor],
	);

	console.log('provider', room, value);

	return (
		<OmnichannelRoomContext.Provider
			value={contextValue}
			children={children}
		></OmnichannelRoomContext.Provider>
	);
};
export default OmnichannelRoomProvider;
