import { Input } from '@rocket.chat/fuselage';

type ABACRoomAutocompleteDummyProps = {
	roomInfo: { rid: string; name: string };
};

const ABACRoomAutocompleteDummy = ({ roomInfo }: ABACRoomAutocompleteDummyProps) => {
	return <Input value={roomInfo.name} disabled />;
};

export default ABACRoomAutocompleteDummy;
