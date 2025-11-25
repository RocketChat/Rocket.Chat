import RoomHeader from './RoomHeader';
import type { RoomHeaderProps } from './RoomHeader';

const RoomInviteHeader = ({ room, slots = {} }: RoomHeaderProps) => {
	return <RoomHeader room={room} slots={slots} roomToolbox={null} />;
};

export default RoomInviteHeader;
