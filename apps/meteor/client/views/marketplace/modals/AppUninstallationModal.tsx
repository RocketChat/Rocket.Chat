import type { App } from '@rocket.chat/core-typings';
import React from 'react';
import { useTranslation } from 'react-i18next';

import WarningModal from '../../../components/WarningModal';
import { useUninstallAppMutation } from '../hooks/useUninstallAppMutation';

type AppUninstallationModalProps = {
	app: App;
	onDismiss: () => void;
};

const AppUninstallationModal = ({ app, onDismiss }: AppUninstallationModalProps) => {
	const { t } = useTranslation();

	const uninstallAppMutation = useUninstallAppMutation(app);

	const handleConfirm = async () => {
		await uninstallAppMutation.mutateAsync();
		onDismiss();
	};

	return (
		<WarningModal text={t('Apps_Marketplace_Uninstall_App_Prompt')} confirmText={t('Yes')} confirm={handleConfirm} close={onDismiss} />
	);
};

export default AppUninstallationModal;
