import { VoipInfo } from './VoipInfo';
import { useVoipRoom } from '../../../../room/contexts/RoomContext';
import { useRoomToolbox } from '../../../../room/contexts/RoomToolboxContext';

// Contextual Bar for room view
const VoipInfoWithData = () => {
	const room = useVoipRoom();
	const { closeTab } = useRoomToolbox();

	return <VoipInfo room={room} onClickClose={closeTab} />;
};

export default VoipInfoWithData;
