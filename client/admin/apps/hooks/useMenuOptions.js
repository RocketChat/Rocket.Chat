import React, { useMemo, useCallback } from 'react';
import { Box, Icon, Button, ButtonGroup } from '@rocket.chat/fuselage';

import { useTranslation } from '../../../contexts/TranslationContext';
import { Apps } from '../../../../app/apps/client/orchestrator';
import { Modal } from '../../../components/basic/Modal';
import { appEnabledStatuses, warnStatusChange, handleAPIError } from '../helpers';
import { IframeModal } from '../IframeModal';
import { CloudLoginModal } from '../CloudLoginModal';
import { useCurrentRoute, useRoute } from '../../../contexts/RouterContext';

const WarningModal = ({ text, confirmText, close, cancel, cancelText, confirm, ...props }) => {
	const t = useTranslation();
	return <Modal {...props}>
		<Modal.Header>
			<Icon color='danger' name='modal-warning' size={20}/>
			<Modal.Title>{t('Are_you_sure')}</Modal.Title>
			<Modal.Close onClick={close}/>
		</Modal.Header>
		<Modal.Content fontScale='p1'>
			{text}
		</Modal.Content>
		<Modal.Footer>
			<ButtonGroup align='end'>
				<Button ghost onClick={cancel || close}>{cancelText || t('Cancel')}</Button>
				<Button primary danger onClick={confirm}>{confirmText}</Button>
			</ButtonGroup>
		</Modal.Footer>
	</Modal>;
};

export const useMenuOptions = ({ app, setModal, isLoggedIn }) => {
	const t = useTranslation();
	const currentRoute = useCurrentRoute();
	const router = useRoute(currentRoute[0]);

	const canAppBeSubscribed = app.purchaseType === 'subscription';
	const isSubscribed = app.subscriptionInfo && ['active', 'trialing'].includes(app.subscriptionInfo.status);
	const isAppEnabled = appEnabledStatuses.includes(app.status);

	const closeModal = useCallback(() => setModal(null), []);

	const handleEnable = useCallback(async () => {
		try {
			const effectiveStatus = await Apps.enableApp(app.id);
			warnStatusChange(app.name, effectiveStatus);
		} catch (error) {
			handleAPIError(error);
		}
	}, [app.id]);

	const handleViewLogs = useCallback(() => router.push({ context: 'logs', id: app.id }), [app.id]);

	const handleSubscription = useCallback(async () => {
		if (!isLoggedIn) {
			setModal(<CloudLoginModal cancel={closeModal} />);
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
	}, [app.id, app.purchaseType, isLoggedIn]);

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
	}, [app.id, app.name]);

	const handleUninstall = useCallback(() => {
		const uninstall = async () => {
			closeModal();
			try {
				await Apps.uninstallApp(app.id);
			} catch (error) {
				handleAPIError(error);
			}

			if (app.marketplace === false) {
				router.push({});
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
	}, [app.id, isSubscribed]);

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
	}), [canAppBeSubscribed, isAppEnabled, handleEnable]);

	return menuOptions;
};
