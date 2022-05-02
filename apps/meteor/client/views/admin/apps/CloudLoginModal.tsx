import React, { ReactElement } from 'react';

import GenericModal from '../../../components/GenericModal';
import { useSetModal } from '../../../contexts/ModalContext';
import { useRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';

const CloudLoginModal = (): ReactElement => {
	const t = useTranslation();
	const setModal = useSetModal();
	const cloudRoute = useRoute('cloud');

	const handleCancel = (): void => {
		setModal(undefined);
	};

	const handleLogin = (): void => {
		cloudRoute.push();
		setModal(undefined);
	};

	return (
		<GenericModal
			variant='warning'
			confirmText={t('Login')}
			title={t('Apps_Marketplace_Login_Required_Title')}
			onClose={handleCancel}
			onCancel={handleCancel}
			onConfirm={handleLogin}
		>
			{t('Apps_Marketplace_Login_Required_Description')}
		</GenericModal>
	);
};

export default CloudLoginModal;
