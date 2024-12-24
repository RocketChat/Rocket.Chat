import { SidebarV2ListItem } from '@rocket.chat/fuselage';
import type { ForwardedRef, HTMLAttributes } from 'react';
import { forwardRef } from 'react';

type RoomListRoomWrapperProps = HTMLAttributes<HTMLDivElement>;

const RoomListRoomWrapper = forwardRef(function RoomListRoomWrapper(props: RoomListRoomWrapperProps, ref: ForwardedRef<HTMLDivElement>) {
	return <SidebarV2ListItem ref={ref} {...props} />;
});

export default RoomListRoomWrapper;
