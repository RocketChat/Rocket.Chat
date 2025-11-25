import RoomHeader from './RoomHeader';
import type { RoomHeaderProps } from './RoomHeader';

const RoomInviteHeader = ({ room }: RoomHeaderProps) => {
	return <RoomHeader room={room} roomToolbox={null} />;
};

export default RoomInviteHeader;
