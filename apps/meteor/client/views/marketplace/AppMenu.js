import { Box, Icon, Menu, Skeleton } from '@rocket.chat/fuselage';
import {
	useSetModal,
	useEndpoint,
	useTranslation,
	useRouteParameter,
	useToastMessageDispatch,
	usePermission,
	useRouter,
} from '@rocket.chat/ui-contexts';
import React, { useMemo, useCallback, useState } from 'react';
import semver from 'semver';

import WarningModal from '../../components/WarningModal';
import { useIsEnterprise } from '../../hooks/useIsEnterprise';
import IframeModal from './IframeModal';
import UninstallGrandfatheredAppModal from './components/UninstallGrandfatheredAppModal/UninstallGrandfatheredAppModal';
import { appEnabledStatuses, appButtonProps } from './helpers';
import { handleAPIError } from './helpers/handleAPIError';
import { marketplaceActions } from './helpers/marketplaceActions';
import { warnEnableDisableApp } from './helpers/warnEnableDisableApp';
import { useAppInstallationHandler } from './hooks/useAppInstallationHandler';
import { useAppsCountQuery } from './hooks/useAppsCountQuery';
import { useOpenAppPermissionsReviewModal } from './hooks/useOpenAppPermissionsReviewModal';
import { useOpenIncompatibleModal } from './hooks/useOpenIncompatibleModal';

function AppMenu({ app, isAppDetailsPage, ...props }) {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();
	const router = useRouter();

	const context = useRouteParameter('context');
	const currentTab = useRouteParameter('tab');

	const setAppStatus = useEndpoint('POST', `/apps/${app.id}/status`);
	const buildExternalUrl = useEndpoint('GET', '/apps');
	const syncApp = useEndpoint('POST', `/apps/${app.id}/sync`);
	const uninstallApp = useEndpoint('DELETE', `/apps/${app.id}`);
	const { data } = useIsEnterprise();

	const isEnterpriseLicense = !!data?.isEnterprise;

	const [loading, setLoading] = useState(false);
	const [requestedEndUser, setRequestedEndUser] = useState(app.requestedEndUser);

	const canAppBeSubscribed = app.purchaseType === 'subscription';
	const isSubscribed = app.subscriptionInfo && ['active', 'trialing'].includes(app.subscriptionInfo.status);
	const isAppEnabled = appEnabledStatuses.includes(app.status);
	const [isAppPurchased, setPurchased] = useState(app?.isPurchased);

	const isAdminUser = usePermission('manage-apps');
	const appCountQuery = useAppsCountQuery(context);
	const openIncompatibleModal = useOpenIncompatibleModal();

	const button = appButtonProps({ ...app, isAdminUser });
	const action = button?.action || '';

	const closeModal = useCallback(() => {
		setModal(null);
		setLoading(false);
	}, [setModal, setLoading]);

	const installationSuccess = useCallback(
		async (action, permissionsGranted) => {
			if (action === 'purchase') {
				setPurchased(true);
			}

			if (action === 'request') {
				setRequestedEndUser(true);
			} else {
				await marketplaceActions[action]({ ...app, permissionsGranted });
			}

			setLoading(false);
		},
		[app, setLoading],
	);

	const openPermissionModal = useOpenAppPermissionsReviewModal({
		app,
		onCancel: closeModal,
		onConfirm: (permissionsGranted) => installationSuccess(action, permissionsGranted),
	});

	const appInstallationHandler = useAppInstallationHandler({
		app,
		isAppPurchased,
		action,
		onDismiss: closeModal,
		onSuccess: installationSuccess,
	});

	const handleAcquireApp = useCallback(() => {
		setLoading(true);
		appInstallationHandler();
	}, [appInstallationHandler, setLoading]);

	const handleSubscription = useCallback(async () => {
		if (app?.versionIncompatible && !isSubscribed) {
			openIncompatibleModal(app, 'subscribe', closeModal);
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
	}, [app, isSubscribed, setModal, closeModal, openIncompatibleModal, buildExternalUrl, syncApp]);

	const handleViewLogs = useCallback(() => {
		router.navigate({
			name: 'marketplace',
			params: {
				context,
				page: 'info',
				id: app.id,
				version: app.version,
				tab: 'logs',
			},
		});
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
						router.navigate(
							{
								name: 'marketplace',
								params: { ...router.getRouteParameters(), tab: 'details' },
							},
							{ replace: true },
						);
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

		if (!appCountQuery.data) {
			return;
		}

		if (app.migrated) {
			setModal(
				<UninstallGrandfatheredAppModal
					context={context}
					appName={app.name}
					limit={appCountQuery.data.limit}
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
		isSubscribed,
		appCountQuery.data,
		app.migrated,
		app.name,
		setModal,
		closeModal,
		t,
		uninstallApp,
		dispatchToastMessage,
		context,
		currentTab,
		router,
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
			openIncompatibleModal(app, 'update', closeModal);
			return;
		}

		openPermissionModal();
	}, [app, openPermissionModal, openIncompatibleModal, closeModal]);

	const canUpdate = app.installed && app.version && app.marketplaceVersion && semver.lt(app.version, app.marketplaceVersion);

	const menuOptions = useMemo(() => {
		const bothAppStatusOptions = {
			...(canAppBeSubscribed &&
				isSubscribed &&
				isAdminUser && {
					subscribe: {
						label: (
							<>
								<Icon name={incompatibleIconName(app, 'subscribe')} size='x16' mie='x4' />
								{t('Subscription')}
							</>
						),
						action: handleSubscription,
					},
				}),
		};

		const nonInstalledAppOptions = {
			...(!app.installed &&
				button && {
					acquire: {
						label: (
							<>
								{isAdminUser && <Icon name={incompatibleIconName(app, 'install')} size='x16' mie='x4' />}
								{t(button.label.replace(' ', '_'))}
							</>
						),
						action: handleAcquireApp,
						disabled: requestedEndUser,
					},
				}),
		};

		const isEnterpriseOrNot = (app.isEnterpriseOnly && isEnterpriseLicense) || !app.isEnterpriseOnly;
		const isPossibleToEnableApp = app.installed && isAdminUser && !isAppEnabled && isEnterpriseOrNot;
		const doesItReachedTheLimit =
			!app.migrated && !appCountQuery?.data?.hasUnlimitedApps && appCountQuery?.data?.enabled >= appCountQuery?.data?.limit;

		const installedAppOptions = {
			...(context !== 'details' &&
				isAdminUser &&
				app.installed && {
					viewLogs: {
						label: (
							<>
								<Icon name='desktop-text' size='x16' mie='x4' />
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
								<Icon name={incompatibleIconName(app, 'update')} size='x16' mie='x4' />
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
							<Box color='status-font-on-warning'>
								<Icon name='ban' size='x16' mie='x4' />
								{t('Disable')}
							</Box>
						),
						action: handleDisable,
					},
				}),
			...(isPossibleToEnableApp && {
				enable: {
					label: (
						<>
							<Icon name='check' size='x16' marginInlineEnd='x4' />
							{t('Enable')}
						</>
					),
					disabled: doesItReachedTheLimit,
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
							<Box color='status-font-on-danger'>
								<Icon name='trash' size='x16' mie='x4' />
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
		button,
		handleAcquireApp,
		requestedEndUser,
		isEnterpriseLicense,
		isAppEnabled,
		appCountQuery?.data?.hasUnlimitedApps,
		appCountQuery?.data?.enabled,
		appCountQuery?.data?.limit,
		context,
		handleViewLogs,
		canUpdate,
		isAppDetailsPage,
		handleUpdate,
		handleDisable,
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
