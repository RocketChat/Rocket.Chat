import { useSetModal } from '@rocket.chat/ui-contexts';
import React from 'react';

import OmnichannelVerificationBadge from '../../../omnichannel/components/OmnichannelVerificationBadge';
import AdvancedContactModal from '../../../omnichannel/contactInfo/AdvancedContactModal';
import { useOmnichannelRoom } from '../../contexts/RoomContext';

const OmnichannelRoomHeaderTag = () => {
	const setModal = useSetModal();
	const { verified } = useOmnichannelRoom();

	return (
		<OmnichannelVerificationBadge verified={verified} onClick={() => setModal(<AdvancedContactModal onCancel={() => setModal(null)} />)} />
	);
};

export default OmnichannelRoomHeaderTag;
