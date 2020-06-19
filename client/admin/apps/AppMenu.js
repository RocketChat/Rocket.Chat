import { Box, Icon, Menu } from '@rocket.chat/fuselage';
import React, { useMemo, useCallback } from 'react';

import { Apps } from '../../../app/apps/client/orchestrator';
import { useSetModal } from '../../contexts/ModalContext';
import { useRoute } from '../../contexts/RouterContext';
import { useMethod } from '../../contexts/ServerContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { appEnabledStatuses, warnStatusChange, handleAPIError } from './helpers';
import { CloudLoginModal } from './CloudLoginModal';
import { IframeModal } from './IframeModal';
import WarningModal from './WarningModal';

export default function AppMenu({ app, ...props }) {
	const t = useTranslation();
	const setModal = useSetModal();
	const appsRoute = useRoute('admin-apps');
	const checkUserLoggedIn = useMethod('cloud:checkUserLoggedIn');

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
		appsRoute.push({ context: 'logs', id: app.id });
	}, [app.id, appsRoute]);

	const handleSubscription = useCallback(async () => {
		if (!await checkUserLoggedIn()) {
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
	}, [checkUserLoggedIn, app.id, app.purchaseType, closeModal, setModal]);

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
			label: <Box>
				<Icon name='card' size='x16' marginInlineEnd='x4' />{t('Subscription')}
			</Box>,
			action: handleSubscription,
		} },
		viewLogs: {
			label: <Box>
				<Icon name='list-alt' size='x16' marginInlineEnd='x4' />{t('View_Logs')}
			</Box>,
			action: handleViewLogs,
		},
		...isAppEnabled && {
			disable: {
				label: <Box color='warning'>
					<Icon name='ban' size='x16' marginInlineEnd='x4' />{t('Disable')}</Box>,
				action: handleDisable,
			},
		},
		...!isAppEnabled && { enable: {
			label: <Box>
				<Icon name='check' size='x16' marginInlineEnd='x4' />{t('Enable')}
			</Box>,
			action: handleEnable,
		} },
		uninstall: {
			label: <Box color='danger'>
				<Icon name='trash' size='x16' marginInlineEnd='x4' />{t('Uninstall')}
			</Box>,
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
