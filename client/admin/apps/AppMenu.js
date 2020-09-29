import { Box, Icon, Menu } from '@rocket.chat/fuselage';
import React, { useMemo } from 'react';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { useSetModal } from '../../contexts/ModalContext';
import { useRoute } from '../../contexts/RouterContext';
import { useMethod, useEndpoint } from '../../contexts/ServerContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { appEnabledStatuses, warnStatusChange, handleAPIError } from './helpers';
import { CloudLoginModal } from './CloudLoginModal';
import { IframeModal } from './IframeModal';
import DangerModal from '../../components/DangerModal';

function AppMenu({ app, ...props }) {
	const t = useTranslation();
	const setModal = useSetModal();
	const appsRoute = useRoute('admin-apps');
	const checkUserLoggedIn = useMethod('cloud:checkUserLoggedIn');

	const setAppStatus = useEndpoint('POST', `/apps/${ app.id }/status`);
	const buildExternalUrl = useEndpoint('GET', '/apps');
	const syncApp = useEndpoint('POST', `/apps/${ app.id }/sync`);
	const uninstallApp = useEndpoint('DELETE', `/apps/${ app.id }`);

	const canAppBeSubscribed = app.purchaseType === 'subscription';
	const isSubscribed = app.subscriptionInfo && ['active', 'trialing'].includes(app.subscriptionInfo.status);
	const isAppEnabled = appEnabledStatuses.includes(app.status);

	const closeModal = useMutableCallback(() => setModal(null));

	const handleEnable = useMutableCallback(async () => {
		try {
			const { status } = await setAppStatus({ status: 'manually_enabled' });
			warnStatusChange(app.name, status);
		} catch (error) {
			handleAPIError(error);
		}
	});

	const handleViewLogs = useMutableCallback(() => {
		appsRoute.push({ context: 'logs', id: app.id });
	});

	const handleSubscription = useMutableCallback(async () => {
		if (!await checkUserLoggedIn()) {
			setModal(<CloudLoginModal />);
			return;
		}

		let data;
		try {
			data = await buildExternalUrl({
				buildExternalUrl: 'true',
				appId: app.id,
				purchaseType: app.purchaseType,
				details: true,
			});
		} catch (error) {
			handleAPIError(error);
			return;
		}

		const confirm = async () => {
			try {
				await syncApp();
			} catch (error) {
				handleAPIError(error);
			}
		};

		setModal(<IframeModal url={data.url} confirm={confirm} cancel={closeModal}/>);
	});

	const handleDisable = useMutableCallback(() => {
		const confirm = async () => {
			closeModal();
			try {
				const { status } = await setAppStatus({ status: 'manually_disabled' });
				warnStatusChange(app.name, status);
			} catch (error) {
				handleAPIError(error);
			}
		};

		setModal(<DangerModal
			title={t('Are_you_sure')}
			onConfirm={confirm}
			onCancel={closeModal}
			onClose={closeModal}
			confirmButtonText={t('Yes')}
			secondaryButtonText={t('Cancel')}
		>
			{t('Apps_Marketplace_Deactivate_App_Prompt')}
		</DangerModal>);
	});

	const handleUninstall = useMutableCallback(() => {
		const uninstall = async () => {
			closeModal();
			try {
				await uninstallApp();
			} catch (error) {
				handleAPIError(error);
			}
		};

		if (isSubscribed) {
			const confirm = async () => {
				await handleSubscription();
			};

			setModal(<DangerModal
				title={t('Are_you_sure')}
				onConfirm={confirm}
				onCancel={uninstall}
				onClose={closeModal}
				confirmButtonText={t('Apps_Marketplace_Modify_App_Subscription')}
				secondaryButtonText={t('Apps_Marketplace_Uninstall_Subscribed_App_Anyway')}
			>
				{t('Apps_Marketplace_Uninstall_Subscribed_App_Prompt')}
			</DangerModal>);
		}

		setModal(<DangerModal
			title={t('Are_you_sure')}
			onConfirm={uninstall}
			onCancel={closeModal}
			onClose={closeModal}
			confirmButtonText={t('Yes')}
			secondaryButtonText={t('Cancel')}
		>
			{t('Apps_Marketplace_Uninstall_App_Prompt')}
		</DangerModal>);
	});

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

	return <Menu options={menuOptions} placement='bottom-start' {...props}/>;
}

export default AppMenu;
