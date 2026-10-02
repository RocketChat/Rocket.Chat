import { Box } from '@rocket.chat/fuselage';
import type { ForwardedRef, HTMLAttributes } from 'react';
import { forwardRef } from 'react';

export type RoomListRoomWrapperProps = Omit<HTMLAttributes<HTMLDivElement>, 'color' | 'is'>;

const RoomListRoomWrapper = forwardRef(function RoomListRoomWrapper(props: RoomListRoomWrapperProps, ref: ForwardedRef<HTMLDivElement>) {
	return <Box role='listitem' paddingInline={4} ref={ref} {...props} />;
});

export default RoomListRoomWrapper;
