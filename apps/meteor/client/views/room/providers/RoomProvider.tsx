import type { IRoom } from '@rocket.chat/core-typings';
import { useUserSubscription } from '@rocket.chat/ui-contexts';
import React, { ReactNode, useContext, useMemo, memo, useEffect, useCallback } from 'react';

import { UserAction } from '../../../../app/ui';
import { RoomManager, useHandleRoom } from '../../../lib/RoomManager';
import { AsyncStatePhase } from '../../../lib/asyncState';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import RoomSkeleton from '../RoomSkeleton';
import { RoomContext, RoomContextValue } from '../contexts/RoomContext';
import ToolboxProvider from './ToolboxProvider';

type RoomProviderProps = {
	children: ReactNode;
	rid: IRoom['_id'];
};

const fields = {};

const RoomProvider = ({ rid, children }: RoomProviderProps): JSX.Element => {
	const { phase, value: room } = useHandleRoom(rid);

	const getMore = useCallback(() => {
		RoomManager.getMore(rid);
	}, [rid]);

	const subscribed = Boolean(useUserSubscription(rid, fields));
	const context = useMemo(() => {
		if (!room) {
			return null;
		}
		room._id = rid;
		return {
			subscribed,
			rid,
			getMore,
			room: { ...room, name: roomCoordinator.getRoomName(room.t, room) },
		};
	}, [room, rid, subscribed, getMore]);

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
		return <RoomSkeleton />;
	}

	return (
		<RoomContext.Provider value={context}>
			<ToolboxProvider room={room}>{children}</ToolboxProvider>
		</RoomContext.Provider>
	);
};

export const useRoom = (): IRoom => {
	const context = useContext(RoomContext);
	if (!context) {
		throw Error('useRoom should be used only inside rooms context');
	}
	return context.room;
};

export const useRoomContext = (): RoomContextValue => {
	const context = useContext(RoomContext);
	if (!context) {
		throw Error('useRoom should be used only inside rooms context');
	}
	return context;
};

export default memo(RoomProvider);
