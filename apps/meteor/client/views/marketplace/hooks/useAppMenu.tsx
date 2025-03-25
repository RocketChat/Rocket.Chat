import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { App, AppPermission } from '@rocket.chat/core-typings';
import { Box, Icon } from '@rocket.chat/fuselage';
import {
	useSetModal,
	useEndpoint,
	useTranslation,
	useRouteParameter,
	useToastMessageDispatch,
	usePermission,
	useRouter,
} from '@rocket.chat/ui-contexts';
import type { MouseEvent, ReactNode } from 'react';
import { useMemo, useCallback, useState } from 'react';
import semver from 'semver';

import { useAppInstallationHandler } from './useAppInstallationHandler';
import type { MarketplaceRouteContext } from './useAppsCountQuery';
import { useAppsCountQuery } from './useAppsCountQuery';
import { useMarketplaceActions } from './useMarketplaceActions';
import { useOpenAppPermissionsReviewModal } from './useOpenAppPermissionsReviewModal';
import { useOpenIncompatibleModal } from './useOpenIncompatibleModal';
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
import { warnEnableDisableApp } from '../helpers/warnEnableDisableApp';

export type AppMenuOption = {
	id: string;
	section: number;
	content: ReactNode;
	disabled?: boolean;
	onClick?: (e?: MouseEvent<HTMLElement>) => void;
};

type AppMenuSections = {
	items: AppMenuOption[];
}[];

export const useAppMenu = (app: App, isAppDetailsPage: boolean) => {
	const t = useTranslation();
	const router = useRouter();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const openIncompatibleModal = useOpenIncompatibleModal();

	const context = useRouteParameter('context') as MarketplaceRouteContext;
	const currentTab = useRouteParameter('tab');
	const appCountQuery = useAppsCountQuery(context);

	const isAdminUser = usePermission('manage-apps');
	const { data } = useIsEnterprise();
	const isEnterpriseLicense = !!data?.isEnterprise;

	const workspaceHasMarketplaceAddon = useHasLicenseModule(app.addon);
	const workspaceHasInstalledAddon = useHasLicenseModule(app.installedAddon);

	const [isLoading, setLoading] = useState(false);
	const [requestedEndUser, setRequestedEndUser] = useState(app.requestedEndUser);
	const [isAppPurchased, setPurchased] = useState(app?.isPurchased);

	const button = appButtonProps({ ...app, isAdminUser, endUserRequested: false });
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

	const setAppStatus = useEndpoint<'POST', '/apps/:id/status'>('POST', '/apps/:id/status', { id: app.id });
	const buildExternalUrl = useEndpoint('GET', '/apps');
	const syncApp = useEndpoint<'POST', '/apps/:id/sync'>('POST', '/apps/:id/sync', { id: app.id });
	const uninstallApp = useEndpoint<'DELETE', '/apps/:id'>('DELETE', '/apps/:id', { id: app.id });

	const canAppBeSubscribed = app.purchaseType === 'subscription';
	const isSubscribed = app.subscriptionInfo && ['active', 'trialing'].includes(app.subscriptionInfo.status);
	const isAppEnabled = app.status ? appEnabledStatuses.includes(app.status) : false;

	const closeModal = useCallback(() => {
		setModal(null);
		setLoading(false);
	}, [setModal, setLoading]);

	const marketplaceActions = useMarketplaceActions();

	const installationSuccess = useCallback(
		async (action: Actions | '', permissionsGranted?: AppPermission[]) => {
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
			if (actionType === 'enable' && isAdminUser && app.installedAddon && !workspaceHasInstalledAddon) {
				return missingAddonHandler(actionType);
			}

			if (actionType !== 'enable' && isAdminUser && app.addon && !workspaceHasMarketplaceAddon) {
				return missingAddonHandler(actionType);
			}

			callback();
		},
		[app.addon, app.installedAddon, isAdminUser, missingAddonHandler, workspaceHasInstalledAddon, workspaceHasMarketplaceAddon],
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
				const { status } = await setAppStatus({ status: AppStatus.MANUALLY_DISABLED });
				warnEnableDisableApp(app.name, status, 'disable');
			} catch (error) {
				handleAPIError(error);
			}
		};
		setModal(
			<WarningModal close={closeModal} confirm={confirm} text={t('Apps_Marketplace_Deactivate_App_Prompt')} confirmText={t('Yes')} />,
		);
	}, [app.name, closeModal, setAppStatus, setModal, t]);

	const handleEnable = useCallback(() => {
		handleAddon('enable', async () => {
			try {
				const { status } = await setAppStatus({ status: AppStatus.MANUALLY_ENABLED });
				warnEnableDisableApp(app.name, status, 'enable');
			} catch (error) {
				handleAPIError(error);
			}
		});
	}, [app.name, handleAddon, setAppStatus]);

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
		(app: App, action: 'subscribe' | 'install' | 'update') => {
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

	const canUpdate = app.installed && app.version && app.marketplaceVersion && semver.lt(app.version, app.marketplaceVersion);

	const menuSections = useMemo(() => {
		const bothAppStatusOptions = [
			canAppBeSubscribed &&
				isSubscribed &&
				isAdminUser && {
					id: 'subscribe',
					section: 0,
					content: (
						<>
							<Icon name={incompatibleIconName(app, 'subscribe')} size='x16' mie={4} />
							{t('Subscription')}
						</>
					),
					onClick: handleSubscription,
				},
		];

		const nonInstalledAppOptions = [
			!app.installed &&
				!!button && {
					id: 'acquire',
					section: 0,
					disabled: requestedEndUser,
					content: (
						<>
							{isAdminUser && <Icon name={incompatibleIconName(app, 'install')} size='x16' mie={4} />}
							{t(buttonLabel)}
						</>
					),
					onClick: handleAcquireApp,
				},
		];

		const isPossibleToEnableApp =
			app.installed &&
			isAdminUser &&
			!isAppEnabled &&
			// If the app is migrated, it can be enabled regardless of other validations
			// If not, and the app isEnterpriseOnly, we need to check the workspace's license
			(app.migrated || !app.isEnterpriseOnly || isEnterpriseLicense);

		const doesItReachedTheLimit =
			!app.migrated &&
			!appCountQuery?.data?.hasUnlimitedApps &&
			appCountQuery?.data?.enabled !== undefined &&
			appCountQuery?.data?.enabled >= appCountQuery?.data?.limit;

		const installedAppOptions = [
			context !== 'details' &&
				isAdminUser &&
				app.installed && {
					id: 'viewLogs',
					section: 0,
					content: (
						<>
							<Icon name='desktop-text' size='x16' mie={4} />
							{t('View_Logs')}
						</>
					),
					onClick: handleViewLogs,
				},
			isAdminUser &&
				!!canUpdate &&
				!isAppDetailsPage && {
					id: 'update',
					section: 0,
					content: (
						<>
							<Icon name={incompatibleIconName(app, 'update')} size='x16' mie={4} />
							{t('Update')}
						</>
					),
					onClick: handleUpdate,
				},
			app.installed &&
				isAdminUser &&
				isAppEnabled && {
					id: 'disable',
					section: 0,
					content: (
						<Box color='status-font-on-warning'>
							<Icon name='ban' size='x16' mie={4} />
							{t('Disable')}
						</Box>
					),
					onClick: handleDisable,
				},
			isPossibleToEnableApp && {
				id: 'enable',
				section: 0,
				disabled: doesItReachedTheLimit,
				content: (
					<>
						<Icon name='check' size='x16' marginInlineEnd='x4' />
						{t('Enable')}
					</>
				),
				onClick: handleEnable,
			},
			app.installed &&
				isAdminUser && {
					id: 'uninstall',
					section: 1,
					content: (
						<Box color='status-font-on-danger'>
							<Icon name='trash' size='x16' mie={4} />
							{t('Uninstall')}
						</Box>
					),
					onClick: handleUninstall,
				},
		];

		const filtered = [...bothAppStatusOptions, ...nonInstalledAppOptions, ...installedAppOptions].flatMap((value) =>
			value && typeof value !== 'boolean' ? value : [],
		);

		const sections: AppMenuSections = [];

		filtered.forEach((option) => {
			if (typeof sections[option.section] === 'undefined') {
				sections[option.section] = { items: [] };
			}

			sections[option.section].items.push(option);
		});

		return sections;
	}, [
		canAppBeSubscribed,
		isSubscribed,
		isAdminUser,
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
		context,
		handleViewLogs,
		canUpdate,
		isAppDetailsPage,
		handleUpdate,
		handleDisable,
		handleEnable,
		handleUninstall,
	]);

	return { isLoading, isAdminUser, sections: menuSections };
};
