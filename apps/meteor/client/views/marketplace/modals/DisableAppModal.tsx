import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { App } from '@rocket.chat/core-typings';
import React from 'react';
import { useTranslation } from 'react-i18next';

import WarningModal from '../../../components/WarningModal';
import { useSetAppStatusMutation } from '../hooks/useSetAppStatusMutation';

type DisableAppModalProps = {
	app: App;
	onClose: () => void;
};

const DisableAppModal = ({ app, onClose }: DisableAppModalProps) => {
	const { t } = useTranslation();

	const setAppStatusMutation = useSetAppStatusMutation(app);

	const handleConfirm = async () => {
		await setAppStatusMutation.mutateAsync(AppStatus.MANUALLY_DISABLED);
		onClose();
	};

	return <WarningModal text={t('Apps_Marketplace_Deactivate_App_Prompt')} confirmText={t('Yes')} confirm={handleConfirm} close={onClose} />;
};

export default DisableAppModal;
