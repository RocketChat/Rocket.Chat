import { Input } from '@rocket.chat/fuselage';

export type RoomFormAutocompleteDummyProps = {
	roomInfo: { rid: string; name: string };
};

const RoomFormAutocompleteDummy = ({ roomInfo }: RoomFormAutocompleteDummyProps) => {
	return <Input value={roomInfo.name} disabled />;
};

export default RoomFormAutocompleteDummy;
