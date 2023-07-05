import type { App } from '@rocket.chat/core-typings';
import { useEndpoint, useRoute, useRouteParameter, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import { AppClientOrchestratorInstance } from '../../../../ee/client/apps/orchestrator';
import IframeModal from '../IframeModal';
import AppInstallModal from '../components/AppInstallModal/AppInstallModal';
import type { Actions } from '../helpers';
import { handleAPIError } from '../helpers/handleAPIError';
import { isMarketplaceRouteContext, useAppsCountQuery } from './useAppsCountQuery';
import { useOpenAppPermissionsReviewModal } from './useOpenAppPermissionsReviewModal';
import { useOpenIncompatibleModal } from './useOpenIncompatibleModal';

export type AppInstallationHandlerParams = {
	app: App;
	action: Actions;
	isAppPurchased: boolean;
	onDismiss: () => void;
	onSuccess: (action: Actions, appPermissions?: App['permissions']) => void;
};

export function useAppInstallationHandler({ app, action, isAppPurchased, onDismiss, onSuccess }: AppInstallationHandlerParams) {
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const upgradeRoute = useRoute('upgrade');
	const routeContext = String(useRouteParameter('context'));
	const context = isMarketplaceRouteContext(routeContext) ? routeContext : 'explore';

	const appCountQuery = useAppsCountQuery(context);

	const notifyAdmins = useEndpoint('POST', `/apps/notify-admins`);

	const openIncompatibleModal = useOpenIncompatibleModal();

	const closeModal = useCallback(() => {
		setModal(null);
		onDismiss();
	}, [onDismiss, setModal]);

	const success = useCallback(
		(appPermissions?: App['permissions']) => {
			setModal(null);
			onSuccess(action, appPermissions);
		},
		[action, onSuccess, setModal],
	);

	const openPermissionModal = useOpenAppPermissionsReviewModal({ app, onCancel: closeModal, onConfirm: success });

	const acquireApp = useCallback(async () => {
		if (action === 'purchase' && !isAppPurchased) {
			try {
				const data = await AppClientOrchestratorInstance.buildExternalUrl(app.id, app.purchaseType, false);
				setModal(<IframeModal url={data.url} cancel={onDismiss} confirm={openPermissionModal} />);
			} catch (error) {
				handleAPIError(error);
			}
			return;
		}

		openPermissionModal();
	}, [action, isAppPurchased, openPermissionModal, app.id, app.purchaseType, setModal, onDismiss]);

	return useCallback(async () => {
		if (app?.versionIncompatible) {
			openIncompatibleModal(app, action, closeModal);
			return;
		}

		if (action === 'request') {
			const requestConfirmAction = (postMessage: Record<string, unknown>) => {
				setModal(null);
				dispatchToastMessage({ type: 'success', message: 'App request submitted' });

				notifyAdmins({
					appId: app.id,
					appName: app.name,
					appVersion: app.marketplaceVersion,
					message: typeof postMessage.message === 'string' ? postMessage.message : '',
				});

				success();
			};

			try {
				const data = await AppClientOrchestratorInstance.buildExternalAppRequest(app.id);
				setModal(<IframeModal url={data.url} wrapperHeight='x460' cancel={onDismiss} confirm={requestConfirmAction} />);
			} catch (error) {
				handleAPIError(error);
			}
			return;
		}

		if (!appCountQuery.data) {
			return;
		}

		if (appCountQuery.data.hasUnlimitedApps) {
			return acquireApp();
		}

		setModal(
			<AppInstallModal
				context={context}
				enabled={appCountQuery.data.enabled}
				limit={appCountQuery.data.limit}
				appName={app.name}
				handleClose={closeModal}
				handleConfirm={acquireApp}
				handleEnableUnlimitedApps={() => {
					upgradeRoute.push({ type: 'go-fully-featured-registered' });
					setModal(null);
				}}
			/>,
		);
	}, [
		app,
		action,
		appCountQuery.data,
		setModal,
		context,
		acquireApp,
		openIncompatibleModal,
		closeModal,
		dispatchToastMessage,
		notifyAdmins,
		success,
		onDismiss,
		upgradeRoute,
	]);
}
