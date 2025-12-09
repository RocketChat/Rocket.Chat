import RoomHeader from './RoomHeader';
import type { RoomHeaderProps } from './RoomHeader';

const RoomInviteHeader = ({ room }: Pick<RoomHeaderProps, 'room'>) => {
	return (
		<RoomHeader
			room={room}
			slots={{
				toolbox: {
					hidden: true,
				},
			}}
		/>
	);
};

export default RoomInviteHeader;
