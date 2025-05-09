import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import GenericModal from '../../components/GenericModal';

type PrioritiesResetModalProps = {
	onReset: () => Promise<void>;
	onCancel: () => void;
};

export const PrioritiesResetModal = ({ onCancel, onReset }: PrioritiesResetModalProps): ReactElement => {
	const { t } = useTranslation();

	return (
		<GenericModal
			variant='danger'
			title={t('Reset_priorities')}
			onConfirm={onReset}
			onCancel={onCancel}
			onClose={onCancel}
			confirmText={t('Reset')}
		>
			{t('Are_you_sure_you_want_to_reset_the_name_of_all_priorities')}
		</GenericModal>
	);
};
