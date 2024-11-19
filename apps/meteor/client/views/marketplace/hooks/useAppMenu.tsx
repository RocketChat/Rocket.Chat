import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { App } from '@rocket.chat/core-typings';
import { Box, Icon } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useEndpoint, usePermission, useRouter } from '@rocket.chat/ui-contexts';
import type { MouseEvent, ReactNode } from 'react';
import React, { useMemo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import semver from 'semver';

import { useAppInstallationHandler } from './useAppInstallationHandler';
import { useAppsCountQuery } from './useAppsCountQuery';
import { useMarketplaceActions } from './useMarketplaceActions';
import { useMarketplaceContext } from './useMarketplaceContext';
import { useOpenAppPermissionsReviewModal } from './useOpenAppPermissionsReviewModal';
import { useOpenIncompatibleModal } from './useOpenIncompatibleModal';
import { useSetAppStatusMutation } from './useSetAppStatusMutation';
import { useUninstallAppMutation } from './useUninstallAppMutation';
import WarningModal from '../../../components/WarningModal';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import type { AddonActionType } from '../AppsList/AddonRequiredModal';
import AddonRequiredModal from '../AppsList/AddonRequiredModal';
import IframeModal from '../IframeModal';
import UninstallGrandfatheredAppModal from '../components/UninstallGrandfatheredAppModal/UninstallGrandfatheredAppModal';
import type { Actions } from '../helpers';
import { appEnabledStatuses, appButtonProps } from '../helpers';
import { handleAPIError } from '../helpers/handleAPIError';

export type AppMenuOption = {
	id: string;
	content: ReactNode;
	disabled?: boolean;
	onClick?: (e?: MouseEvent<HTMLElement>) => void;
};

export const useAppMenu = (app: App, isAppDetailsPage: boolean) => {
	const { t } = useTranslation();
	const router = useRouter();
	const setModal = useSetModal();
	const openIncompatibleModal = useOpenIncompatibleModal();

	const context = useMarketplaceContext();
	const appCountQuery = useAppsCountQuery(context);

	const canManageApps = usePermission('manage-apps');
	const { data: { isEnterprise: isEnterpriseLicense = false } = {} } = useIsEnterprise();

	const workspaceHasMarketplaceAddon = useHasLicenseModule(app.addon);
	const workspaceHasInstalledAddon = useHasLicenseModule(app.installedAddon);

	const [isLoading, setLoading] = useState(false);
	const [requestedEndUser, setRequestedEndUser] = useState(app.requestedEndUser);
	const [isAppPurchased, setPurchased] = useState(app?.isPurchased);

	const button = appButtonProps({ ...app, isAdminUser: canManageApps, endUserRequested: false });
	const buttonLabel = button?.label.replace(' ', '_') as
		| 'Update'
		| 'Install'
		| 'Subscribe'
		| 'See_Pricing'
		| 'Try_now'
		| 'Buy'
		| 'Request'
		| 'Requested';
	const action = button?.action || '';

	const buildExternalUrl = useEndpoint('GET', '/apps');
	const syncApp = useEndpoint('POST', '/apps/:id/sync', { id: app.id });

	const isSubscribed = app.subscriptionInfo && ['active', 'trialing'].includes(app.subscriptionInfo.status);
	const isAppEnabled = app.status ? appEnabledStatuses.includes(app.status) : false;

	const closeModal = useCallback(() => {
		setModal(null);
		setLoading(false);
	}, [setModal, setLoading]);

	const marketplaceActions = useMarketplaceActions();

	const installationSuccess = useCallback(
		async (action: Actions | '', permissionsGranted) => {
			if (action) {
				if (action === 'request') {
					setRequestedEndUser(true);
				} else {
					await marketplaceActions[action]({ ...app, permissionsGranted });
				}
			}

			setLoading(false);
		},
		[app, marketplaceActions, setLoading],
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
		setIsPurchased: setPurchased,
	});

	// TODO: There is no necessity of all these callbacks being out of the above useMemo.
	// My propose here is to refactor the hook to make it clearer and with less unnecessary caching.
	const missingAddonHandler = useCallback(
		(actionType: AddonActionType) => {
			setModal(<AddonRequiredModal actionType={actionType} onDismiss={closeModal} onInstallAnyway={appInstallationHandler} />);
		},
		[appInstallationHandler, closeModal, setModal],
	);

	const handleAddon = useCallback(
		(actionType: AddonActionType, callback: () => void) => {
			if (actionType === 'enable' && canManageApps && app.installedAddon && !workspaceHasInstalledAddon) {
				return missingAddonHandler(actionType);
			}

			if (actionType !== 'enable' && canManageApps && app.addon && !workspaceHasMarketplaceAddon) {
				return missingAddonHandler(actionType);
			}

			callback();
		},
		[app.addon, app.installedAddon, canManageApps, missingAddonHandler, workspaceHasInstalledAddon, workspaceHasMarketplaceAddon],
	);

	const handleAcquireApp = useCallback(() => {
		setLoading(true);
		handleAddon('install', appInstallationHandler);
	}, [appInstallationHandler, handleAddon]);

	const handleSubscription = useCallback(async () => {
		if (app?.versionIncompatible && !isSubscribed) {
			openIncompatibleModal(app, 'subscribe', closeModal);
			return;
		}

		let data;
		try {
			data = (await buildExternalUrl({
				buildExternalUrl: 'true',
				appId: app.id,
				purchaseType: app.purchaseType,
				details: 'true',
			})) as { url: string };
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

	const handleViewLogs = useEffectEvent(() => {
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
	});

	const setAppStatusMutation = useSetAppStatusMutation(app);

	const handleEnable = useEffectEvent(() => {
		if (canManageApps && app.installedAddon && !workspaceHasInstalledAddon) {
			return missingAddonHandler('enable');
		}

		setAppStatusMutation.mutate(AppStatus.MANUALLY_ENABLED);
	});

	const handleDisable = useEffectEvent(() => {
		const handleConfirm = () => {
			closeModal();
			setAppStatusMutation.mutate(AppStatus.MANUALLY_DISABLED);
		};

		const handleClose = () => {
			closeModal();
		};

		setModal(
			<WarningModal
				text={t('Apps_Marketplace_Deactivate_App_Prompt')}
				confirmText={t('Yes')}
				confirm={handleConfirm}
				close={handleClose}
			/>,
		);
	});

	const uninstallAppMutation = useUninstallAppMutation(app);

	const handleUninstall = useEffectEvent(() => {
		const uninstall = async () => {
			closeModal();
			await uninstallAppMutation.mutateAsync();
		};

		if (isSubscribed) {
			const confirm = async () => {
				await handleSubscription();
			};

			setModal(
				<WarningModal
					text={t('Apps_Marketplace_Uninstall_Subscribed_App_Prompt')}
					confirmText={t('Apps_Marketplace_Modify_App_Subscription')}
					cancelText={t('Apps_Marketplace_Uninstall_Subscribed_App_Anyway')}
					close={closeModal}
					cancel={uninstall}
					confirm={confirm}
				/>,
			);
		}

		if (app.migrated) {
			setModal(<UninstallGrandfatheredAppModal appName={app.name} handleUninstall={uninstall} handleClose={closeModal} />);
			return;
		}

		setModal(
			<WarningModal close={closeModal} confirm={uninstall} text={t('Apps_Marketplace_Uninstall_App_Prompt')} confirmText={t('Yes')} />,
		);
	});

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

		handleAddon('update', openPermissionModal);
	}, [app, handleAddon, openPermissionModal, openIncompatibleModal, closeModal]);

	const sections = useMemo(() => {
		function* generateOptions(): Generator<AppMenuOption> {
			if (app.purchaseType === 'subscription' && isSubscribed && canManageApps) {
				yield {
					id: 'subscribe',
					content: (
						<>
							<Icon name={incompatibleIconName(app, 'subscribe')} size='x16' mie={4} />
							{t('Subscription')}
						</>
					),
					onClick: handleSubscription,
				};
			}

			if (!app.installed && button) {
				yield {
					id: 'acquire',
					disabled: requestedEndUser,
					content: (
						<>
							{canManageApps && <Icon name={incompatibleIconName(app, 'install')} size='x16' mie={4} />}
							{t(buttonLabel)}
						</>
					),
					onClick: handleAcquireApp,
				};

				return;
			}

			if (!canManageApps || !app.installed) {
				return;
			}

			yield {
				id: 'viewLogs',
				content: (
					<>
						<Icon name='desktop-text' size='x16' mie={4} />
						{t('View_Logs')}
					</>
				),
				onClick: handleViewLogs,
			};

			if (!isAppDetailsPage && app.version && app.marketplaceVersion && semver.lt(app.version, app.marketplaceVersion)) {
				yield {
					id: 'update',
					content: (
						<>
							<Icon name={incompatibleIconName(app, 'update')} size='x16' mie={4} />
							{t('Update')}
						</>
					),
					onClick: handleUpdate,
				};
			}

			if (isAppEnabled) {
				yield {
					id: 'disable',
					content: (
						<Box color='status-font-on-warning'>
							<Icon name='ban' size='x16' mie={4} />
							{t('Disable')}
						</Box>
					),
					onClick: handleDisable,
				};
			} else if (!app.isEnterpriseOnly || isEnterpriseLicense) {
				const doesItReachedTheLimit =
					!app.migrated &&
					!appCountQuery?.data?.hasUnlimitedApps &&
					appCountQuery?.data?.enabled !== undefined &&
					appCountQuery?.data?.enabled >= appCountQuery?.data?.limit;

				yield {
					id: 'enable',
					disabled: doesItReachedTheLimit,
					content: (
						<>
							<Icon name='check' size='x16' marginInlineEnd='x4' />
							{t('Enable')}
						</>
					),
					onClick: handleEnable,
				};
			}
		}

		function* generateSpecialOptions(): Generator<AppMenuOption> {
			if (!canManageApps || !app.installed) {
				return;
			}

			yield {
				id: 'uninstall',
				content: (
					<Box color='status-font-on-danger'>
						<Icon name='trash' size='x16' mie={4} />
						{t('Uninstall')}
					</Box>
				),
				onClick: handleUninstall,
			};
		}

		const sections: { items: AppMenuOption[] }[] = [];

		const normalOptions = Array.from(generateOptions());
		if (normalOptions.length) {
			sections.push({ items: normalOptions });
		}

		const specialOptions = Array.from(generateSpecialOptions());
		if (specialOptions.length) {
			sections.push({ items: specialOptions });
		}

		return sections;
	}, [
		isSubscribed,
		canManageApps,
		incompatibleIconName,
		app,
		t,
		handleSubscription,
		button,
		requestedEndUser,
		buttonLabel,
		handleAcquireApp,
		isEnterpriseLicense,
		isAppEnabled,
		appCountQuery?.data?.hasUnlimitedApps,
		appCountQuery?.data?.enabled,
		appCountQuery?.data?.limit,
		handleViewLogs,
		isAppDetailsPage,
		handleUpdate,
		handleDisable,
		handleEnable,
		handleUninstall,
	]);

	return { isLoading: isLoading || setAppStatusMutation.isLoading, sections };
};
