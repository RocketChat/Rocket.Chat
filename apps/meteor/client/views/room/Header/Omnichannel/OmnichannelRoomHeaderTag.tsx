import { Box, Icon, Tag } from '@rocket.chat/fuselage';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import AdvancedContactModal from '../../../omnichannel/contactInfo/AdvancedContactModal';
import { useOmnichannelRoom } from '../../contexts/RoomContext';

const OmnichannelRoomHeaderTag = () => {
	const t = useTranslation();
	const setModal = useSetModal();
	const { verified } = useOmnichannelRoom();

	if (verified) {
		return <Icon title={t('Verified')} mis={4} size='x16' name='success-circle' color='stroke-highlight' />;
	}

	return (
		<Box mis={4} withTruncatedText>
			<Tag
				onClick={() => setModal(<AdvancedContactModal onCancel={() => setModal(null)} />)}
				icon={<Icon size='x12' mie={4} name='question-mark' />}
			>
				{t('Unverified')}
			</Tag>
		</Box>
	);
};

export default OmnichannelRoomHeaderTag;
