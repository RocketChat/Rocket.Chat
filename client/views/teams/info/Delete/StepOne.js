import React from 'react';
import { Box } from '@rocket.chat/fuselage';

import GenericModal from '../../../../components/GenericModal';
import { useTranslation } from '../../../../contexts/TranslationContext';

const StepOne = ({ onConfirm, onClose, onCancel }) => {
	const t = useTranslation();
	return <GenericModal
		variant='warning'
		confirmText={t('Continue')}
		onConfirm={onConfirm}
		onCancel={onCancel}
		onClose={onCancel}
		onClose={onClose}
	>
		<Box withRichContent>{t('Teams_delete_team_warning')}</Box>
	</GenericModal>;
};

export default StepOne;
