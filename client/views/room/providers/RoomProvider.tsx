import React, { ReactNode, useContext, useMemo, memo, useEffect, useCallback } from 'react';

import { roomTypes } from '../../../../app/utils/client';
import { IRoom } from '../../../../definition/IRoom';
import { RoomManager, useHandleRoom } from '../../../lib/RoomManager';
import { AsyncStatePhase } from '../../../lib/asyncState';
import RoomSkeleton from '../Room/RoomSkeleton';
import { RoomContext, RoomContextValue } from '../contexts/RoomContext';
import ToolboxProvider from './ToolboxProvider';

export type Props = {
	children: ReactNode;
	rid: IRoom['_id'];
};

const openUserCard = () => {
	console.log('openUserCard');
};
const followMessage = () => {
	console.log('followMessage');
};
const unfollowMessage = () => {
	console.log('unfollowMessage');
};
const openDiscussion = () => {
	console.log('openDiscussion');
};
const openThread = () => {
	console.log('openThread');
};
const replyBroadcast = () => {
	console.log('replyBroadcast');
};

const RoomProvider = ({ rid, children }: Props): JSX.Element => {
	const { phase, value: room } = useHandleRoom(rid);

	const getMore = useCallback(() => {
		RoomManager.getMore(rid);
	}, [rid]);

	const context = useMemo(() => {
		if (!room) {
			return null;
		}
		room._id = rid;
		return {
			rid,
			actions: {
				openUserCard,
				followMessage,
				unfollowMessage,
				openDiscussion,
				openThread,
				replyBroadcast,
			},
			getMore,
			room: { ...room, name: roomTypes.getRoomName(room.t, room) },
		};
	}, [room, rid, getMore]);

	useEffect(() => {
		RoomManager.open(rid);
		return (): void => {
			RoomManager.back(rid);
		};
	}, [rid]);

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

export const useRoomActions = (): RoomContextValue['actions'] => {
	const context = useContext(RoomContext);
	if (!context) {
		throw Error('useRoom should be used only inside rooms context');
	}
	return context.actions;
};

export default memo(RoomProvider);
