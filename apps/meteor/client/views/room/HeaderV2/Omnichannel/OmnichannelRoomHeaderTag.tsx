import { useSetModal } from '@rocket.chat/ui-contexts';
import React from 'react';

import OmnichannelVerificationTag from '../../../omnichannel/components/OmnichannelVerificationTag';
import AdvancedContactModal from '../../../omnichannel/contactInfo/AdvancedContactModal';
import { useOmnichannelRoom } from '../../contexts/RoomContext';

const OmnichannelRoomHeaderTag = () => {
	const setModal = useSetModal();
	const { verified } = useOmnichannelRoom();

	return (
		<OmnichannelVerificationTag verified={verified} onClick={() => setModal(<AdvancedContactModal onCancel={() => setModal(null)} />)} />
	);
};

export default OmnichannelRoomHeaderTag;
