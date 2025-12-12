import { useRoomToolbox } from '@rocket.chat/ui-contexts';

import { VoipInfo } from './VoipInfo';
import { useVoipRoom } from '../../../../room/contexts/RoomContext';

const VoipInfoWithData = () => {
	const room = useVoipRoom();
	const { closeTab } = useRoomToolbox();

	return <VoipInfo room={room} onClickClose={closeTab} />;
};

export default VoipInfoWithData;
