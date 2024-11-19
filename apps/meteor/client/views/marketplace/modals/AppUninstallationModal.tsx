import type { App } from '@rocket.chat/core-typings';
import React from 'react';
import { useTranslation } from 'react-i18next';

import WarningModal from '../../../components/WarningModal';
import { useUninstallAppMutation } from '../hooks/useUninstallAppMutation';

type AppUninstallationModalProps = {
	app: App;
	onClose: () => void;
};

const AppUninstallationModal = ({ app, onClose }: AppUninstallationModalProps) => {
	const { t } = useTranslation();

	const uninstallAppMutation = useUninstallAppMutation(app);

	const handleConfirm = async () => {
		await uninstallAppMutation.mutateAsync();
		onClose();
	};

	return <WarningModal text={t('Apps_Marketplace_Uninstall_App_Prompt')} confirmText={t('Yes')} confirm={handleConfirm} close={onClose} />;
};

export default AppUninstallationModal;
