import { SidebarListItem } from '@rocket.chat/fuselage';
import type { ForwardedRef, HTMLAttributes } from 'react';
import { forwardRef } from 'react';

export type RoomListRoomWrapperProps = HTMLAttributes<HTMLDivElement>;

const RoomListRoomWrapper = forwardRef(function RoomListRoomWrapper(props: RoomListRoomWrapperProps, ref: ForwardedRef<HTMLDivElement>) {
	return <SidebarListItem ref={ref} {...props} />;
});

export default RoomListRoomWrapper;
