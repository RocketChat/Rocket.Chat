import React from 'react';

import GenericModal from '../../../components/GenericModal';
import { useTranslation } from '../../../contexts/TranslationContext';

const ChannelToTeamModal = ({
	onClose,
	onConfirm,
}) => {
	const t = useTranslation();

	return <GenericModal
		title={t('Confirmation')}
		variant='warning'
		onClose={onClose}
		onCancel={onClose}
		onConfirm={onConfirm}
	>
		{t('Teams_convert_channel_to_team_warning')}
	</GenericModal>;
};

export default ChannelToTeamModal;
