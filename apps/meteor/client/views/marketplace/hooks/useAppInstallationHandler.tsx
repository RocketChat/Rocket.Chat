import type { App } from '@rocket.chat/core-typings';
import { useEndpoint, useRouteParameter, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { isMarketplaceRouteContext, useAppsCountQuery } from './useAppsCountQuery';
import { useOpenAppPermissionsReviewModal } from './useOpenAppPermissionsReviewModal';
import { useExternalLink } from '../../../hooks/useExternalLink';
import { useCheckoutUrl } from '../../admin/subscription/hooks/useCheckoutUrl';
import IframeModal from '../IframeModal';
import AppInstallModal from '../components/AppInstallModal/AppInstallModal';
import type { Actions } from '../helpers';
import { useAppsOrchestration } from './useAppsOrchestration';
import { useOpenIncompatibleModal } from './useOpenIncompatibleModal';
import { handleAPIError } from '../helpers/handleAPIError';

export type AppInstallationHandlerParams = {
	app: App;
	action: Actions | '';
	isAppPurchased?: boolean;
	onDismiss: () => void;
	onSuccess: (action: Actions | '', appPermissions?: App['permissions']) => void;
	setIsPurchased: (purchased: boolean) => void;
};

export function useAppInstallationHandler({
	app,
	action,
	isAppPurchased,
	onDismiss,
	onSuccess,
	setIsPurchased,
}: AppInstallationHandlerParams) {
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const routeContext = String(useRouteParameter('context'));
	const context = isMarketplaceRouteContext(routeContext) ? routeContext : 'explore';

	const appCountQuery = useAppsCountQuery(context);

	const notifyAdmins = useEndpoint('POST', `/apps/notify-admins`);

	const openIncompatibleModal = useOpenIncompatibleModal();

	const openExternalLink = useExternalLink();
	const manageSubscriptionUrl = useCheckoutUrl()({ target: 'user-page', action: 'buy_more' });

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

	const appsOrchestrator = useAppsOrchestration();

	if (!appsOrchestrator) {
		throw new Error('Apps orchestrator is not available');
	}

	const acquireApp = useCallback(async () => {
		if (action === 'purchase' && !isAppPurchased) {
			try {
				const data = await appsOrchestrator.buildExternalUrl(app.id, app.purchaseType, false);
				setModal(
					<IframeModal
						url={data.url}
						cancel={onDismiss}
						confirm={() => {
							setIsPurchased(true);
							openPermissionModal();
						}}
					/>,
				);
			} catch (error) {
				handleAPIError(error);
			}
			return;
		}

		openPermissionModal();
	}, [action, isAppPurchased, openPermissionModal, appsOrchestrator, app.id, app.purchaseType, setModal, onDismiss, setIsPurchased]);

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
				const data = await appsOrchestrator.buildExternalAppRequest(app.id);
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
				enabled={appCountQuery.data.enabled}
				limit={appCountQuery.data.limit}
				appName={app.name}
				handleClose={closeModal}
				handleConfirm={acquireApp}
				handleEnableUnlimitedApps={() => {
					openExternalLink(manageSubscriptionUrl);
					setModal(null);
				}}
			/>,
		);
	}, [
		app,
		action,
		appCountQuery.data,
		setModal,
		closeModal,
		acquireApp,
		openIncompatibleModal,
		dispatchToastMessage,
		notifyAdmins,
		success,
		appsOrchestrator,
		onDismiss,
		openExternalLink,
		manageSubscriptionUrl,
	]);
}
