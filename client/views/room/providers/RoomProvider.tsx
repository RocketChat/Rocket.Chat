import React, { ReactNode, useContext, useMemo } from 'react';

import { IRoom } from '../../../../definition/IRoom';
import { useUserId, useUserSubscription } from '../../../contexts/UserContext';
import { RoomContext } from '../contexts/RoomContext';
import { ToolboxProvider } from './ToolboxProvider';
import { roomTypes } from '../../../../app/utils/client';
import { useUserRoom } from '../hooks/useUserRoom';

const fields = {};

export type Props = {
	children: ReactNode;
	rid: IRoom['_id'];
};

const RoomProvider = ({ rid, children }: Props): JSX.Element => {
	const uid = useUserId();
	const subscription = useUserSubscription(rid, fields) as unknown as IRoom;
	const _room = useUserRoom(rid, fields) as unknown as IRoom;

	const room = uid ? subscription || _room : _room;
	const context = useMemo(() => {
		if (!room) {
			return null;
		}
		room._id = rid;
		return {
			rid,
			room: { ...room, name: roomTypes.getRoomName(room.t, room) },
		};
	}, [room, rid]);

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
