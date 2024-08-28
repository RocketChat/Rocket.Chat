import { SideBarListItem } from '@rocket.chat/fuselage';
import type { ForwardedRef, HTMLAttributes } from 'react';
import React, { forwardRef } from 'react';

type RoomListRoomWrapperProps = HTMLAttributes<HTMLDivElement>;

const RoomListRoomWrapper = forwardRef(function RoomListRoomWrapper(props: RoomListRoomWrapperProps, ref: ForwardedRef<HTMLDivElement>) {
	return <SideBarListItem ref={ref} {...props} />;
});

export default RoomListRoomWrapper;
