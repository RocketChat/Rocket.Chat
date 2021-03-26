import { Box } from '@rocket.chat/fuselage';
import React from 'react';

import GenericModal from '../../../../components/GenericModal';
import { useTranslation } from '../../../../contexts/TranslationContext';
import TeamAutocomplete from '../../TeamAutocomplete';

const StepOne = ({ teamId = '', onChange, onClose, onCancel, onConfirm }) => {
	const t = useTranslation();

	return (
		<GenericModal
			variant='warning'
			cancelText={t('Cancel')}
			confirmText={t('Continue')}
			title={t('Teams_Select_a_team')}
			onClose={onClose}
			onCancel={onCancel}
			onConfirm={onConfirm}
		>
			<Box withRichContent>{t('Teams_move_channel_to_team_description')}</Box>

			<Box display='flex' width='100%'>
				<TeamAutocomplete onChange={onChange} value={teamId} />
			</Box>
		</GenericModal>
	);
};

export default StepOne;
