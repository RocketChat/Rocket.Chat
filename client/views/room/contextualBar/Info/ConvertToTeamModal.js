import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import GenericModal from '../../../../components/GenericModal';
import { useTranslation } from '../../../../contexts/TranslationContext';

const ChannelToTeamModal = ({ onClose, onConfirm }) => {
	const t = useTranslation();

	return (
		<GenericModal
			title={t('Confirmation')}
			variant='warning'
			onClose={onClose}
			onCancel={onClose}
			onConfirm={onConfirm}
			confirmText={t('Convert')}
		>
			<Box is='span' fontWeight='600' color='danger-500'>
				{t('This_cant_be_undone')}
			</Box>
			{` ${t('Once_you_convert_a_channel_to_team')}`}
		</GenericModal>
	);
};

export default ChannelToTeamModal;
