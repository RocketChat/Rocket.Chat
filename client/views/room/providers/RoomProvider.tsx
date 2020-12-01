import React, { ReactNode, useContext, useMemo } from 'react';

import { IRoom } from '../../../../definition/IRoom';
import { useUserSubscription } from '../../../contexts/UserContext';
import { RoomContext } from '../contexts/RoomContext';
import { ToolboxProvider } from './ToolboxProvider';

const fields = {};

export type Props = {
	children: ReactNode;
	rid: IRoom['_id'];
};

const RoomProvider = ({ rid, children }: Props): JSX.Element => {
	const room = useUserSubscription(rid, fields) as unknown as IRoom;
	room._id = rid;
	const context = useMemo(() => ({
		rid,
		room,
	}), [room, rid]);

	if (!room) {
		return <></>;
	}

	return <RoomContext.Provider value={context}>
		<ToolboxProvider room={room}>
			{children}
		</ToolboxProvider>
	</RoomContext.Provider>;
};

export const useRoom = (): undefined | IRoom => useContext(RoomContext)?.room;
export default RoomProvider;
