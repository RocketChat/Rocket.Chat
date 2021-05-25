import React from 'react';

import GenericModal from '../../../../../components/GenericModal';
import { useTranslation } from '../../../../../contexts/TranslationContext';

export const StepTwo = ({ onConfirm, onCancel, onClose }) => {
	const t = useTranslation();

	return (
		<GenericModal
			variant='danger'
			icon='info-circled'
			title={t('Confirmation')}
			onConfirm={onConfirm}
			onCancel={onCancel}
			onClose={onClose}
			confirmText={t('Leave')}
			cancelText={t('Back')}
		>
			{t('Teams_leaving_team')}
		</GenericModal>
	);
};

export default StepTwo;
