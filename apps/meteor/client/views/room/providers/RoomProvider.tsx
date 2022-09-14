import { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useQuery } from '@tanstack/react-query';
import React, { ReactNode, useMemo, memo, useEffect, ContextType, ReactElement } from 'react';

import { UserAction } from '../../../../app/ui';
import { RoomManager } from '../../../lib/RoomManager';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import RoomSkeleton from '../RoomSkeleton';
import { RoomAPIContext } from '../contexts/RoomAPIContext';
import { RoomContext } from '../contexts/RoomContext';
import ToolboxProvider from './ToolboxProvider';

type RoomProviderProps = {
	children: ReactNode;
	rid: IRoom['_id'];
};

const RoomProvider = ({ rid, children }: RoomProviderProps): ReactElement => {
	const roomQuery = useQuery<IRoom, Error>(['rooms', rid], { staleTime: Infinity });
	const subscriptionQuery = useQuery<ISubscription, Error>(['subscriptions', { rid }], { staleTime: Infinity });

	const pseudoRoom = useMemo(() => {
		if (!subscriptionQuery.isSuccess || !roomQuery.isSuccess) {
			return null;
		}

		return {
			...subscriptionQuery.data,
			...roomQuery.data,
			name: roomCoordinator.getRoomName(roomQuery.data.t, roomQuery.data),
		};
	}, [roomQuery.data, roomQuery.isSuccess, subscriptionQuery.data, subscriptionQuery.isSuccess]);

	const context = useMemo((): ContextType<typeof RoomContext> => {
		if (!pseudoRoom) {
			return null;
		}

		return {
			rid,
			room: pseudoRoom,
			subscription: subscriptionQuery.data,
		};
	}, [pseudoRoom, rid, subscriptionQuery.data]);

	useEffect(() => {
		RoomManager.open(rid);
		return (): void => {
			RoomManager.back(rid);
		};
	}, [rid]);

	useEffect(() => {
		if (!subscriptionQuery.data) {
			return;
		}

		UserAction.addStream(rid);
		return (): void => {
			UserAction.cancel(rid);
		};
	}, [rid, subscriptionQuery.data]);

	const api = useMemo((): ContextType<typeof RoomAPIContext> => ({}), []);

	if (!pseudoRoom) {
		return <RoomSkeleton />;
	}

	return (
		<RoomAPIContext.Provider value={api}>
			<RoomContext.Provider value={context}>
				<ToolboxProvider room={pseudoRoom}>{children}</ToolboxProvider>
			</RoomContext.Provider>
		</RoomAPIContext.Provider>
	);
};

export default memo(RoomProvider);
