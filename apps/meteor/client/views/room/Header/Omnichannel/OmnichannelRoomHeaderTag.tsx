import { Text } from '@rocket.chat/fuselage';
import { useSetModal } from '@rocket.chat/ui-contexts';

import OmnichannelVerificationTag from '../../../omnichannel/components/OmnichannelVerificationTag';
import AdvancedContactModal from '../../../omnichannel/contactInfo/AdvancedContactModal';
import { useOmnichannelRoom } from '../../contexts/RoomContext';

const OmnichannelRoomHeaderTag = () => {
	const setModal = useSetModal();
	const { verified } = useOmnichannelRoom();

	return (
		<Text truncate>
			<OmnichannelVerificationTag verified={verified} onClick={() => setModal(<AdvancedContactModal onCancel={() => setModal(null)} />)} />
		</Text>
	);
};

export default OmnichannelRoomHeaderTag;
