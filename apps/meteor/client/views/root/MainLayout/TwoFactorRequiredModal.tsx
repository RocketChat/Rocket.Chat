import { GenericModal } from '@rocket.chat/ui-client';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

const TwoFactorRequiredModal = () => {
	const { t } = useTranslation();
	const setModal = useSetModal();

	const closeModal = useCallback(() => {
		setModal(null);
	}, [setModal]);

	return (
		<GenericModal
			title={t('Two-factor_authentication_required')}
			confirmText={t('Set_up_2FA')}
			onConfirm={closeModal}
			onClose={closeModal}
		>
			{t('Enable_two-factor_authentication_callout_description')}
		</GenericModal>
	);
};

export default TwoFactorRequiredModal;
