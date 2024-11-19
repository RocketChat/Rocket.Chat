import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { App } from '@rocket.chat/core-typings';
import { Box, Icon } from '@rocket.chat/fuselage';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, usePermission, useRouter } from '@rocket.chat/ui-contexts';
import type { MouseEvent, ReactNode } from 'react';
import React, { useMemo, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import semver from 'semver';

import { useAppInstallationHandler } from './useAppInstallationHandler';
import { useAppsCountQuery } from './useAppsCountQuery';
import { useMarketplaceActions } from './useMarketplaceActions';
import { useMarketplaceContext } from './useMarketplaceContext';
import { useOpenAppPermissionsReviewModal } from './useOpenAppPermissionsReviewModal';
import { useSetAppStatusMutation } from './useSetAppStatusMutation';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import type { AddonActionType } from '../modals/AddonRequiredModal';
import AddonRequiredModal from '../modals/AddonRequiredModal';
import type { Actions } from '../helpers';
import { appEnabledStatuses, appButtonProps } from '../helpers';
import AppUninstallationModal from '../modals/AppUninstallationModal';
import DisableAppModal from '../modals/DisableAppModal';
import IncompatibleModal from '../modals/IncompatibleModal';
import ModifySubscriptionModal from '../modals/ModifySubscriptionModal';
import UninstallGrandfatheredAppModal from '../modals/UninstallGrandfatheredAppModal';
import UninstallingAppWithActiveSubscriptionModal from '../modals/UninstallingAppWithActiveSubscriptionModal';

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

	const context = useMarketplaceContext();
	const appCountQuery = useAppsCountQuery(context);

	const canManageApps = usePermission('manage-apps');
	const { data: { isEnterprise: isEnterpriseLicense = false } = {} } = useIsEnterprise();

	const workspaceHasMarketplaceAddon = useHasLicenseModule(app.addon);
	const workspaceHasInstalledAddon = useHasLicenseModule(app.installedAddon);

	const [isLoading, setLoading] = useState(false);
	const [requestedEndUser, setRequestedEndUser] = useState(app.requestedEndUser);

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

	const installApp = useAppInstallationHandler({
		app,
		action,
		onDismiss: closeModal,
		onSuccess: installationSuccess,
	});

	// TODO: There is no necessity of all these callbacks being out of the above useMemo.
	// My propose here is to refactor the hook to make it clearer and with less unnecessary caching.
	const missingAddonHandler = useCallback(
		(actionType: AddonActionType) => {
			setModal(<AddonRequiredModal actionType={actionType} onClose={closeModal} onInstallAnyway={installApp} />);
		},
		[installApp, closeModal, setModal],
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
		handleAddon('install', installApp);
	}, [installApp, handleAddon]);

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

	const handleEnable = useEffectEvent(async () => {
		if (app.installedAddon && !workspaceHasInstalledAddon) {
			setModal(<AddonRequiredModal actionType='enable' onInstallAnyway={installApp} onClose={closeModal} />);
			return;
		}

		await setAppStatusMutation.mutateAsync(AppStatus.MANUALLY_ENABLED);
	});

	const handleDisable = useEffectEvent(() => {
		setModal(<DisableAppModal app={app} onClose={closeModal} />);
	});

	const handleUninstall = useEffectEvent(() => {
		if (isSubscribed) {
			setModal(<UninstallingAppWithActiveSubscriptionModal app={app} onClose={closeModal} />);
			return;
		}

		if (app.migrated) {
			setModal(<UninstallGrandfatheredAppModal app={app} onClose={closeModal} />);
			return;
		}

		setModal(<AppUninstallationModal app={app} onClose={closeModal} />);
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

	const handleUpdate = useEffectEvent(() => {
		setLoading(true);

		if (app?.versionIncompatible) {
			setModal(<IncompatibleModal app={app} action='update' onClose={closeModal} />);
			return;
		}

		handleAddon('update', openPermissionModal);
	});

	const handleSubscription = useEffectEvent(() => {
		if (app?.versionIncompatible && !isSubscribed) {
			setModal(<IncompatibleModal app={app} action='subscribe' onClose={closeModal} />);
			return;
		}

		setModal(<ModifySubscriptionModal app={app} onClose={closeModal} />);
	});

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
		app,
		appCountQuery?.data?.enabled,
		appCountQuery?.data?.hasUnlimitedApps,
		appCountQuery?.data?.limit,
		button,
		buttonLabel,
		canManageApps,
		handleAcquireApp,
		handleDisable,
		handleEnable,
		handleSubscription,
		handleUninstall,
		handleUpdate,
		handleViewLogs,
		incompatibleIconName,
		isAppDetailsPage,
		isAppEnabled,
		isEnterpriseLicense,
		isSubscribed,
		requestedEndUser,
		t,
	]);

	return { isLoading: isLoading || setAppStatusMutation.isLoading, sections };
};
