import RoomHeader from './RoomHeader';
import type { RoomHeaderProps } from './RoomHeader';

export type RoomInviteHeaderProps = Pick<RoomHeaderProps, 'room'>;

const RoomInviteHeader = ({ room }: RoomInviteHeaderProps) => {
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
