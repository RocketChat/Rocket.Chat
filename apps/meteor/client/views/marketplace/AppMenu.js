import { Box, Icon, Menu, Skeleton } from '@rocket.chat/fuselage';
import {
	useSetModal,
	useEndpoint,
	useTranslation,
	useRoute,
	useRouteParameter,
	useToastMessageDispatch,
	useCurrentRoute,
	usePermission,
} from '@rocket.chat/ui-contexts';
import React, { useMemo, useCallback, useState } from 'react';
import semver from 'semver';

import { Apps } from '../../../ee/client/apps/orchestrator';
import WarningModal from '../../components/WarningModal';
import AppPermissionsReviewModal from './AppPermissionsReviewModal';
import IframeModal from './IframeModal';
import AppInstallModal from './components/AppInstallModal/AppInstallModal';
import UninstallGrandfatheredAppModal from './components/UninstallGrandfatheredAppModal/UninstallGrandfatheredAppModal';
import { appEnabledStatuses, handleAPIError, appButtonProps, warnEnableDisableApp } from './helpers';
import { marketplaceActions } from './helpers/marketplaceActions';
import { useAppsCountQuery } from './hooks/useAppsCountQuery';

const openIncompatibleModal = async (app, action, cancel, setModal) => {
	try {
		const incompatibleData = await Apps.buildIncompatibleExternalUrl(app.id, app.marketplaceVersion, action);
		setModal(<IframeModal url={incompatibleData.url} cancel={cancel} />);
	} catch (e) {
		handleAPIError(e);
	}
};

function AppMenu({ app, isAppDetailsPage, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const [currentRouteName, currentRouteParams] = useCurrentRoute();
	if (!currentRouteName) {
		throw new Error('No current route name');
	}
	const router = useRoute(currentRouteName);
	const upgradeRoute = useRoute('upgradeRoute');

	const context = useRouteParameter('context');
	const currentTab = useRouteParameter('tab');

	const setAppStatus = useEndpoint('POST', `/apps/${app.id}/status`);
	const buildExternalUrl = useEndpoint('GET', '/apps');
	const syncApp = useEndpoint('POST', `/apps/${app.id}/sync`);
	const uninstallApp = useEndpoint('DELETE', `/apps/${app.id}`);
	const notifyAdmins = useEndpoint('POST', `/apps/notify-admins`);

	const [loading, setLoading] = useState(false);
	const [requestedEndUser, setRequestedEndUser] = useState(app.requestedEndUser);

	const canAppBeSubscribed = app.purchaseType === 'subscription';
	const isSubscribed = app.subscriptionInfo && ['active', 'trialing'].includes(app.subscriptionInfo.status);
	const isAppEnabled = appEnabledStatuses.includes(app.status);
	const [isAppPurchased, setPurchased] = useState(app?.isPurchased);

	const isAdminUser = usePermission('manage-apps');
	const button = appButtonProps({ ...app, isAdminUser });

	const result = useAppsCountQuery(context);

	const cancelAction = useCallback(() => {
		setModal(null);
		setLoading(false);
	}, [setModal]);

	const action = button?.action || '';
	const confirmAction = useCallback(
		async (permissionsGranted) => {
			setModal(null);

			await marketplaceActions[action]({ ...app, permissionsGranted });

			setLoading(false);
		},
		[setModal, action, app, setLoading],
	);

	const showAppPermissionsReviewModal = useCallback(() => {
		if (!isAppPurchased) {
			setPurchased(true);
		}

		return setModal(<AppPermissionsReviewModal appPermissions={app.permissions} onCancel={cancelAction} onConfirm={confirmAction} />);
	}, [app.permissions, cancelAction, confirmAction, isAppPurchased, setModal, setPurchased]);

	const closeModal = useCallback(() => {
		setModal(null);
		setLoading(false);
	}, [setModal]);

	const handleSubscription = useCallback(async () => {
		if (app?.versionIncompatible && !isSubscribed) {
			openIncompatibleModal(app, 'subscribe', closeModal, setModal);
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
	}, [app, setModal, closeModal, isSubscribed, buildExternalUrl, syncApp]);

	const acquireApp = useCallback(async () => {
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
	}, [action, app, isAppPurchased, showAppPermissionsReviewModal, setModal, cancelAction]);

	const handleAcquireApp = useCallback(async () => {
		setLoading(true);

		const requestConfirmAction = (postMessage) => {
			setModal(null);
			setLoading(false);
			setRequestedEndUser(true);
			dispatchToastMessage({ type: 'success', message: 'App request submitted' });

			notifyAdmins({
				appId: app.id,
				appName: app.name,
				appVersion: app.marketplaceVersion,
				message: postMessage.message,
			});
		};

		if (app?.versionIncompatible) {
			openIncompatibleModal(app, 'subscribe', closeModal, setModal);
			return;
		}

		if (action === 'request') {
			try {
				const data = await Apps.buildExternalAppRequest(app.id);
				setModal(<IframeModal url={data.url} wrapperHeight={'x460'} cancel={cancelAction} confirm={requestConfirmAction} />);
			} catch (error) {
				handleAPIError(error);
			}
			return;
		}

		if (!result.data) {
			return;
		}

		if (result.data.hasUnlimitedApps) {
			acquireApp();
		}

		setModal(
			<AppInstallModal
				context={context}
				enabled={result.data.enabled}
				limit={result.data.limit}
				appName={app.name}
				handleClose={() => setModal(null)}
				handleConfirm={acquireApp}
				handleEnableUnlimitedApps={() => {
					upgradeRoute.push();
				}}
			/>,
		);
	}, [app, action, result.data, setModal, context, acquireApp, dispatchToastMessage, notifyAdmins, closeModal, cancelAction, upgradeRoute]);

	const handleViewLogs = useCallback(() => {
		router.push({ context, page: 'info', id: app.id, version: app.version, tab: 'logs' });
	}, [app.id, app.version, context, router]);

	const handleDisable = useCallback(() => {
		const confirm = async () => {
			closeModal();
			try {
				const { status } = await setAppStatus({ status: 'manually_disabled' });
				warnEnableDisableApp(app.name, status, 'disable');
			} catch (error) {
				handleAPIError(error);
			}
		};
		setModal(
			<WarningModal close={closeModal} confirm={confirm} text={t('Apps_Marketplace_Deactivate_App_Prompt')} confirmText={t('Yes')} />,
		);
	}, [app.name, closeModal, setAppStatus, setModal, t]);

	const handleEnable = useCallback(async () => {
		try {
			const { status } = await setAppStatus({ status: 'manually_enabled' });
			warnEnableDisableApp(app.name, status, 'enable');
		} catch (error) {
			handleAPIError(error);
		}
	}, [app.name, setAppStatus]);

	const handleUninstall = useCallback(() => {
		const uninstall = async () => {
			closeModal();
			try {
				const { success } = await uninstallApp();
				if (success) {
					dispatchToastMessage({ type: 'success', message: `${app.name} uninstalled` });
					if (context === 'details' && currentTab !== 'details') {
						router.replace({ ...currentRouteParams, tab: 'details' });
					}
				}
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

		if (!result.data) {
			return;
		}

		if (app.migrated) {
			setModal(
				<UninstallGrandfatheredAppModal
					context={context}
					appName={app.name}
					limit={result.data.limit}
					handleUninstall={uninstall}
					handleClose={closeModal}
				/>,
			);
			return;
		}

		setModal(
			<WarningModal close={closeModal} confirm={uninstall} text={t('Apps_Marketplace_Uninstall_App_Prompt')} confirmText={t('Yes')} />,
		);
	}, [
		result.data,
		app.migrated,
		app.name,
		isSubscribed,
		setModal,
		closeModal,
		t,
		uninstallApp,
		dispatchToastMessage,
		context,
		currentTab,
		router,
		currentRouteParams,
		handleSubscription,
	]);

	const incompatibleIconName = useCallback(
		(app, action) => {
			if (!app.versionIncompatible) {
				if (action === 'update') {
					return 'refresh';
				}

				return 'card';
			}

			// Now we are handling an incompatible app
			if (action === 'subscribe' && !isSubscribed) {
				return 'warning';
			}

			if (action === 'install' || action === 'update') {
				return 'warning';
			}

			return 'card';
		},
		[isSubscribed],
	);

	const handleUpdate = useCallback(async () => {
		setLoading(true);

		if (app?.versionIncompatible) {
			openIncompatibleModal(app, 'update', closeModal, setModal);
			return;
		}

		showAppPermissionsReviewModal();
	}, [app, closeModal, setModal, showAppPermissionsReviewModal]);

	const canUpdate = app.installed && app.version && app.marketplaceVersion && semver.lt(app.version, app.marketplaceVersion);

	const menuOptions = useMemo(() => {
		const bothAppStatusOptions = {
			...(canAppBeSubscribed &&
				isSubscribed &&
				isAdminUser && {
					subscribe: {
						label: (
							<>
								<Icon name={incompatibleIconName(app, 'subscribe')} size='x16' marginInlineEnd='x4' />
								{t('Subscription')}
							</>
						),
						action: handleSubscription,
					},
				}),
		};

		const nonInstalledAppOptions = {
			...(!app.installed && {
				acquire: {
					label: (
						<>
							{isAdminUser && <Icon name={incompatibleIconName(app, 'install')} size='x16' marginInlineEnd='x4' />}
							{t(button.label.replace(' ', '_'))}
						</>
					),
					action: handleAcquireApp,
					disabled: requestedEndUser,
				},
			}),
		};

		const installedAppOptions = {
			...(context !== 'details' &&
				isAdminUser &&
				app.installed && {
					viewLogs: {
						label: (
							<>
								<Icon name='desktop-text' size='x16' marginInlineEnd='x4' />
								{t('View_Logs')}
							</>
						),
						action: handleViewLogs,
					},
				}),
			...(isAdminUser &&
				canUpdate &&
				!isAppDetailsPage && {
					update: {
						label: (
							<>
								<Icon name={incompatibleIconName(app, 'update')} size='x16' marginInlineEnd='x4' />
								{t('Update')}
							</>
						),
						action: handleUpdate,
					},
				}),
			...(app.installed &&
				isAdminUser &&
				isAppEnabled && {
					disable: {
						label: (
							<Box color='on-warning'>
								<Icon name='ban' size='x16' marginInlineEnd='x4' />
								{t('Disable')}
							</Box>
						),
						action: handleDisable,
					},
				}),
			...(app.installed &&
				isAdminUser &&
				!isAppEnabled && {
					enable: {
						label: (
							<>
								<Icon name='check' size='x16' marginInlineEnd='x4' />
								{t('Enable')}
							</>
						),
						disabled: !result?.data?.hasUnlimitedApps && result?.data?.enabled >= result?.data?.limit,
						action: handleEnable,
					},
				}),
			...(app.installed &&
				isAdminUser && {
					divider: {
						type: 'divider',
					},
				}),
			...(app.installed &&
				isAdminUser && {
					uninstall: {
						label: (
							<Box color='on-danger'>
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
		isAdminUser,
		incompatibleIconName,
		app,
		t,
		handleSubscription,
		requestedEndUser,
		button?.label,
		handleAcquireApp,
		context,
		handleViewLogs,
		canUpdate,
		isAppDetailsPage,
		handleUpdate,
		isAppEnabled,
		handleDisable,
		result?.data?.hasUnlimitedApps,
		result?.data?.enabled,
		result?.data?.limit,
		handleEnable,
		handleUninstall,
	]);

	if (loading) {
		return <Skeleton variant='rect' height='x28' width='x28' />;
	}

	if (!isAdminUser && app?.installed) {
		return null;
	}

	return <Menu options={menuOptions} placement='bottom-start' maxHeight='initial' {...props} />;
}

export default AppMenu;
