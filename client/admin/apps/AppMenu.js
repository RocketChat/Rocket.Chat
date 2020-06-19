import { Box, Icon, Menu } from '@rocket.chat/fuselage';
import React, { useMemo, useCallback } from 'react';

import { useTranslation } from '../../contexts/TranslationContext';
import { Apps } from '../../../app/apps/client/orchestrator';
import { appEnabledStatuses, warnStatusChange, handleAPIError } from './helpers';
import { IframeModal } from './IframeModal';
import { CloudLoginModal } from './CloudLoginModal';
import { useRoute } from '../../contexts/RouterContext';
import WarningModal from './WarningModal';
import { useSetModal } from '../../contexts/ModalContext';

export default function AppMenu({ app, isLoggedIn, ...props }) {
	const t = useTranslation();
	const setModal = useSetModal();
	const router = useRoute('admin-apps');

	const canAppBeSubscribed = app.purchaseType === 'subscription';
	const isSubscribed = app.subscriptionInfo && ['active', 'trialing'].includes(app.subscriptionInfo.status);
	const isAppEnabled = appEnabledStatuses.includes(app.status);

	const closeModal = useCallback(() => {
		setModal(null);
	}, [setModal]);

	const handleEnable = useCallback(async () => {
		try {
			const effectiveStatus = await Apps.enableApp(app.id);
			warnStatusChange(app.name, effectiveStatus);
		} catch (error) {
			handleAPIError(error);
		}
	}, [app.id, app.name]);

	const handleViewLogs = useCallback(() => {
		router.push({ context: 'logs', id: app.id });
	}, [app.id, router]);

	const handleSubscription = useCallback(async () => {
		if (!isLoggedIn) {
			setModal(<CloudLoginModal />);
			return;
		}

		let data;
		try {
			data = await Apps.buildExternalUrl(app.id, app.purchaseType, true);
		} catch (error) {
			handleAPIError(error);
			return;
		}

		const confirm = async () => {
			try {
				await Apps.syncApp(app.id);
			} catch (error) {
				handleAPIError(error);
			}
		};

		setModal(<IframeModal url={data.url} confirm={confirm} cancel={closeModal}/>);
	}, [app.id, app.purchaseType, closeModal, isLoggedIn, setModal]);

	const handleDisable = useCallback(() => {
		const confirm = async () => {
			closeModal();
			try {
				const effectiveStatus = await Apps.disableApp(app.id);
				warnStatusChange(app.name, effectiveStatus);
			} catch (error) {
				handleAPIError(error);
			}
		};
		setModal(<WarningModal
			close={closeModal}
			confirm={confirm}
			text={t('Apps_Marketplace_Deactivate_App_Prompt')}
			confirmText={t('Yes')}
		/>);
	}, [app.id, app.name, closeModal, setModal, t]);

	const handleUninstall = useCallback(() => {
		const uninstall = async () => {
			closeModal();
			try {
				await Apps.uninstallApp(app.id);
			} catch (error) {
				handleAPIError(error);
			}
		};

		if (isSubscribed) {
			const confirm = async () => {
				await handleSubscription();
			};

			setModal(<WarningModal
				close={closeModal}
				cancel={uninstall}
				confirm={confirm}
				text={t('Apps_Marketplace_Uninstall_Subscribed_App_Prompt')}
				confirmText={t('Apps_Marketplace_Modify_App_Subscription')}
				cancelText={t('Apps_Marketplace_Uninstall_Subscribed_App_Anyway')}
			/>);
		}

		setModal(<WarningModal
			close={closeModal}
			confirm={uninstall}
			text={t('Apps_Marketplace_Uninstall_App_Prompt')}
			confirmText={t('Yes')}
		/>);
	}, [app.id, closeModal, handleSubscription, isSubscribed, setModal, t]);

	const menuOptions = useMemo(() => ({
		...canAppBeSubscribed && { subscribe: {
			label: <><Icon name='card' size='x16' mie='x8'/>{t('Subscription')}</>,
			action: handleSubscription,
		} },
		viewLogs: {
			label: <><Icon name='list-alt' size='x16' mie='x8'/>{t('View_Logs')}</>,
			action: handleViewLogs,
		},
		...isAppEnabled && { disable: {
			label: <Box color='warning'><Icon mie='x4' name='ban' size='x16'/>{t('Disable')}</Box>,
			action: handleDisable,
		} },
		...!isAppEnabled && { enable: {
			label: <><Icon mie='x4' name='check' size='x16'/>{t('Enable')}</>,
			action: handleEnable,
		} },
		uninstall: {
			label: <Box color='danger'><Icon mie='x4' name='trash' size='x16'/>{t('Uninstall')}</Box>,
			action: handleUninstall,
		},
	}), [
		canAppBeSubscribed,
		t,
		handleSubscription,
		handleViewLogs,
		isAppEnabled,
		handleDisable,
		handleEnable,
		handleUninstall,
	]);

	return <Menu options={menuOptions} placement='bottom left' {...props}/>;
}
