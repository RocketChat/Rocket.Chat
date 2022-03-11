import React, { ReactNode, useMemo, memo, useEffect } from 'react';

import { UserAction } from '../../../../app/ui';
import { IRoom } from '../../../../definition/IRoom';
import { useUserSubscription } from '../../../contexts/UserContext';
import { RoomManager, useHandleRoom } from '../../../lib/RoomManager';
import { AsyncStatePhase } from '../../../lib/asyncState';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import Skeleton from '../Room/Skeleton';
import { RoomContext } from '../contexts/RoomContext';
import ToolboxProvider from './ToolboxProvider';

export type Props = {
	children: ReactNode;
	rid: IRoom['_id'];
};

const fields = {};

const RoomProvider = ({ rid, children }: Props): JSX.Element => {
	const { phase, value: room } = useHandleRoom(rid);

	const subscribed = Boolean(useUserSubscription(rid, fields));
	const context = useMemo(() => {
		if (!room) {
			return null;
		}
		room._id = rid;
		return {
			subscribed,
			rid,
			room: { ...room, name: roomCoordinator.getRoomName(room.t, room) },
		};
	}, [room, rid, subscribed]);

	useEffect(() => {
		RoomManager.open(rid);
		return (): void => {
			RoomManager.back(rid);
		};
	}, [rid]);

	useEffect(() => {
		if (!subscribed) {
			return (): void => undefined;
		}

		UserAction.addStream(rid);
		return (): void => {
			UserAction.cancel(rid);
		};
	}, [rid, subscribed]);

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
