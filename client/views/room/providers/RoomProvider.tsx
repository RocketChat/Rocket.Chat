import React, { ReactNode, useMemo, memo, useEffect } from 'react';

import { roomTypes } from '../../../../app/utils/client';
import { IRoom } from '../../../../definition/IRoom';
import { RoomManager, useHandleRoom } from '../../../lib/RoomManager';
import { AsyncStatePhase } from '../../../lib/asyncState';
import Skeleton from '../Room/Skeleton';
import { RoomContext } from '../contexts/RoomContext';
import ToolboxProvider from './ToolboxProvider';

export type Props = {
	children: ReactNode;
	rid: IRoom['_id'];
};

const RoomProvider = ({ rid, children }: Props): JSX.Element => {
	const { phase, value: room } = useHandleRoom(rid);
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

	useEffect(() => {
		RoomManager.open(rid);
		return (): void => {
			RoomManager.back(rid);
		};
	}, [rid]);

	if (phase === AsyncStatePhase.LOADING || !room) {
		return <Skeleton />;
	}

	return (
		<RoomContext.Provider value={context}>
			<ToolboxProvider room={room}>{children}</ToolboxProvider>
		</RoomContext.Provider>
	);
};
export default memo(RoomProvider);
