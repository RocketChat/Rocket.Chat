import type { HTMLAttributes, Ref } from 'react';
import { forwardRef } from 'react';

const RoomListRoomWrapper = forwardRef(function RoomListRoomWrapper(props: HTMLAttributes<HTMLDivElement>, ref: Ref<HTMLDivElement>) {
	return <div role='listitem' ref={ref} {...props} />;
});

export default RoomListRoomWrapper;
