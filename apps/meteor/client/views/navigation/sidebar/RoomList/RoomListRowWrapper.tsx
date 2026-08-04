import { SidebarV2ListItem } from '@rocket.chat/fuselage';
import type { HTMLAttributes, RefAttributes } from 'react';

export type RoomListRoomWrapperProps = HTMLAttributes<HTMLDivElement> & RefAttributes<HTMLDivElement>;

const RoomListRoomWrapper = ({ ref, ...props }: RoomListRoomWrapperProps) => <SidebarV2ListItem ref={ref} {...props} />;

export default RoomListRoomWrapper;
