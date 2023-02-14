import { Box, Margins } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React from 'react';

import GenericModal from '../../../../../components/GenericModal';
import TeamAutocomplete from '../../../../teams/contextualBar/TeamAutocomplete';

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
			confirmDisabled={!teamId}
		>
			<Margins blockEnd='x20'>
				<Box>{t('Teams_move_channel_to_team_description_first')}</Box>
				<Box>{t('Teams_move_channel_to_team_description_second')}</Box>
				<Box>{t('Teams_move_channel_to_team_description_third')}</Box>
				<Box>{t('Teams_move_channel_to_team_description_fourth')}</Box>
			</Margins>

			<Box display='flex' width='100%'>
				<TeamAutocomplete onChange={onChange} value={teamId} />
			</Box>
		</GenericModal>
	);
};

export default StepOne;
