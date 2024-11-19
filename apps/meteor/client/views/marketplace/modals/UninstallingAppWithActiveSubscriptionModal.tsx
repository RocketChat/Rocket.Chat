import type { App } from '@rocket.chat/core-typings';
import { useSetModal } from '@rocket.chat/ui-contexts';
import React from 'react';
import { useTranslation } from 'react-i18next';

import IncompatibleModal from './IncompatibleModal';
import ModifySubscriptionModal from './ModifySubscriptionModal';
import WarningModal from '../../../components/WarningModal';
import { useUninstallAppMutation } from '../hooks/useUninstallAppMutation';

type UninstallingAppWithActiveSubscriptionModalProps = {
	app: App;
	onClose: () => void;
};

const UninstallingAppWithActiveSubscriptionModal = ({ app, onClose }: UninstallingAppWithActiveSubscriptionModalProps) => {
	const { t } = useTranslation();
	const setModal = useSetModal();

	const handleConfirm = () => {
		const haveActiveSubscription = app.subscriptionInfo && ['active', 'trialing'].includes(app.subscriptionInfo.status);

		if (app?.versionIncompatible && !haveActiveSubscription) {
			setModal(<IncompatibleModal app={app} action='subscribe' onClose={onClose} />);
			return;
		}

		setModal(<ModifySubscriptionModal app={app} onClose={onClose} />);
	};

	const uninstallAppMutation = useUninstallAppMutation(app);

	const handleCancel = async () => {
		await uninstallAppMutation.mutateAsync();
		onClose();
	};

	return (
		<WarningModal
			text={t('Apps_Marketplace_Uninstall_Subscribed_App_Prompt')}
			confirmText={t('Apps_Marketplace_Modify_App_Subscription')}
			cancelText={t('Apps_Marketplace_Uninstall_Subscribed_App_Anyway')}
			confirm={handleConfirm}
			cancel={handleCancel}
			close={onClose}
		/>
	);
};

export default UninstallingAppWithActiveSubscriptionModal;
