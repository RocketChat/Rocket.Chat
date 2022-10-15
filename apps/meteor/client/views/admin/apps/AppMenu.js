import { Box, Icon, Menu, Throbber } from '@rocket.chat/fuselage';
import { useSetModal, useMethod, useEndpoint, useTranslation, useRoute, useRouteParameter } from '@rocket.chat/ui-contexts';
import React, { useMemo, useCallback, useState } from 'react';

import { Apps } from '../../../../app/apps/client/orchestrator';
import AppPermissionsReviewModal from './AppPermissionsReviewModal';
import CloudLoginModal from './CloudLoginModal';
import IframeModal from './IframeModal';
import WarningModal from './WarningModal';
import { appEnabledStatuses, warnStatusChange, handleAPIError, appButtonProps, handleInstallError } from './helpers';

const installApp = async ({ id, name, version, permissionsGranted }) => {
	try {
		const { status } = await Apps.installApp(id, version, permissionsGranted);
		warnStatusChange(name, status);
	} catch (error) {
		handleAPIError(error);
	}
};

const actions = {
	purchase: installApp,
	install: installApp,
	update: async ({ id, name, marketplaceVersion, permissionsGranted }) => {
		try {
			const { status } = await Apps.updateApp(id, marketplaceVersion, permissionsGranted);
			warnStatusChange(name, status);
		} catch (error) {
			handleAPIError(error);
		}
	},
};

function AppMenu({ app, ...props }) {
	const t = useTranslation();
	const setModal = useSetModal();
	const checkUserLoggedIn = useMethod('cloud:checkUserLoggedIn');
	const appsRoute = useRoute('admin-apps');
	const context = useRouteParameter('context');

	const setAppStatus = useEndpoint('POST', `/apps/${app.id}/status`);
	const buildExternalUrl = useEndpoint('GET', '/apps');
	const syncApp = useEndpoint('POST', `/apps/${app.id}/sync`);
	const uninstallApp = useEndpoint('DELETE', `/apps/${app.id}`);

	const [loading, setLoading] = useState(false);

	const canAppBeSubscribed = app.purchaseType === 'subscription';
	const isSubscribed = app.subscriptionInfo && ['active', 'trialing'].includes(app.subscriptionInfo.status);
	const isAppEnabled = appEnabledStatuses.includes(app.status);
	const [isAppPurchased, setPurchased] = useState(app?.isPurchased);

	const button = appButtonProps(app || {});
	const action = button?.action || '';

	const closeModal = useCallback(() => {
		setModal(null);
	}, [setModal]);

	const handleEnable = useCallback(async () => {
		try {
			const { status } = await setAppStatus({ status: 'manually_enabled' });
			warnStatusChange(app.name, status);
		} catch (error) {
			handleAPIError(error);
		}
	}, [app.name, setAppStatus]);

	const handleSubscription = useCallback(async () => {
		if (!(await checkUserLoggedIn())) {
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

		setModal(<IframeModal url={data.url} confirm={confirm} cancel={closeModal} />);
	}, [checkUserLoggedIn, setModal, closeModal, buildExternalUrl, app.id, app.purchaseType, syncApp]);

	const handleViewLogs = useCallback(() => {
		appsRoute.push({ context: 'details', id: app.id, version: app.version, tab: 'logs' });
	}, [app.id, app.version, appsRoute]);

	const handleDisable = useCallback(() => {
		const confirm = async () => {
			closeModal();
			try {
				const { status } = await setAppStatus({ status: 'manually_disabled' });
				warnStatusChange(app.name, status);
			} catch (error) {
				handleAPIError(error);
			}
		};
		setModal(
			<WarningModal close={closeModal} confirm={confirm} text={t('Apps_Marketplace_Deactivate_App_Prompt')} confirmText={t('Yes')} />,
		);
	}, [app.name, closeModal, setAppStatus, setModal, t]);

	const handleUninstall = useCallback(() => {
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

			setModal(
				<WarningModal
					close={closeModal}
					cancel={uninstall}
					confirm={confirm}
					text={t('Apps_Marketplace_Uninstall_Subscribed_App_Prompt')}
					confirmText={t('Apps_Marketplace_Modify_App_Subscription')}
					cancelText={t('Apps_Marketplace_Uninstall_Subscribed_App_Anyway')}
				/>,
			);
		}

		setModal(
			<WarningModal close={closeModal} confirm={uninstall} text={t('Apps_Marketplace_Uninstall_App_Prompt')} confirmText={t('Yes')} />,
		);
	}, [closeModal, handleSubscription, isSubscribed, setModal, t, uninstallApp]);

	const cancelAction = useCallback(() => {
		setModal(null);
		setLoading(false);
	}, [setModal]);

	const confirmAction = useCallback(
		(permissionsGranted) => {
			setModal(null);

			actions[action]({ ...app, permissionsGranted }).then(() => {
				setLoading(false);
			});
		},
		[setModal, action, app, setLoading],
	);

	const showAppPermissionsReviewModal = useCallback(() => {
		if (!isAppPurchased) {
			setPurchased(true);
		}

		if (!Array.isArray(app.permissions)) {
			handleInstallError(new Error('The "permissions" property from the app manifest is invalid'));
		}

		return setModal(<AppPermissionsReviewModal appPermissions={app.permissions} cancel={cancelAction} confirm={confirmAction} />);
	}, [app.permissions, cancelAction, confirmAction, isAppPurchased, setModal, setPurchased]);

	const handleAcquireApp = useCallback(async () => {
		setLoading(true);

		const isLoggedIn = await checkUserLoggedIn();

		if (!isLoggedIn) {
			setLoading(false);
			setModal(<CloudLoginModal />);
			return;
		}

		if (action === 'purchase' && !isAppPurchased) {
			try {
				const data = await Apps.buildExternalUrl(app.id, app.purchaseType, false);
				setModal(<IframeModal url={data.url} cancel={cancelAction} confirm={showAppPermissionsReviewModal} />);
			} catch (error) {
				handleAPIError(error);
			}
			return;
		}

		showAppPermissionsReviewModal();
	}, [action, app.id, app.purchaseType, cancelAction, checkUserLoggedIn, isAppPurchased, setModal, showAppPermissionsReviewModal]);

	const menuOptions = useMemo(() => {
		const bothAppStatusOptions = {
			...(canAppBeSubscribed &&
				isSubscribed && {
					subscribe: {
						label: (
							<Box>
								<Icon name='card' size='x16' marginInlineEnd='x4' />
								{t('Subscription')}
							</Box>
						),
						action: handleSubscription,
					},
				}),
		};

		const nonInstalledAppOptions = {
			...(!app.installed && {
				acquire: {
					label: <Box>{t(button.label.replace(' ', '_'))}</Box>,
					action: handleAcquireApp,
				},
			}),
		};

		const installedAppOptions = {
			...(context !== 'details' &&
				app.installed && {
					viewLogs: {
						label: (
							<Box>
								<Icon name='list-alt' size='x16' marginInlineEnd='x4' />
								{t('View_Logs')}
							</Box>
						),
						action: handleViewLogs,
					},
				}),
			...(app.installed &&
				isAppEnabled && {
					disable: {
						label: (
							<Box color='warning'>
								<Icon name='ban' size='x16' marginInlineEnd='x4' />
								{t('Disable')}
							</Box>
						),
						action: handleDisable,
					},
				}),
			...(app.installed &&
				!isAppEnabled && {
					enable: {
						label: (
							<Box>
								<Icon name='check' size='x16' marginInlineEnd='x4' />
								{t('Enable')}
							</Box>
						),
						action: handleEnable,
					},
				}),
			...(app.installed && {
				uninstall: {
					label: (
						<Box color='danger'>
							<Icon name='trash' size='x16' marginInlineEnd='x4' />
							{t('Uninstall')}
						</Box>
					),
					action: handleUninstall,
				},
			}),
		};

		return {
			...bothAppStatusOptions,
			...nonInstalledAppOptions,
			...installedAppOptions,
		};
	}, [
		canAppBeSubscribed,
		isSubscribed,
		t,
		handleSubscription,
		app.installed,
		button.label,
		handleAcquireApp,
		context,
		handleViewLogs,
		isAppEnabled,
		handleDisable,
		handleEnable,
		handleUninstall,
	]);

	return loading ? <Throbber disabled /> : <Menu options={menuOptions} placement='bottom-start' {...props} />;
}

export default AppMenu;
