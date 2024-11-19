import type { App } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import React, { useCallback, useRef } from 'react';

import { useAppsCountQuery } from './useAppsCountQuery';
import { useAppsOrchestrator } from './useAppsOrchestrator';
import { useMarketplaceContext } from './useMarketplaceContext';
import { useNotifyAdminsMutation } from './useNotifyAdminsMutation';
import { useOpenAppPermissionsReviewModal } from './useOpenAppPermissionsReviewModal';
import { useOpenIncompatibleModal } from './useOpenIncompatibleModal';
import IframeModal from '../IframeModal';
import type { Actions } from '../helpers';
import { handleAPIError } from '../helpers/handleAPIError';
import AppInstallationModal from '../modals/AppInstallationModal';
import PurchaseAppModal from '../modals/PurchaseAppModal';

export type AppInstallationHandlerParams = {
	app: App;
	action: Actions | '';
	onDismiss: () => void;
	onSuccess: (action: Actions | '', appPermissions?: App['permissions']) => void;
};

export const useAppInstallationHandler = ({ app, action, onDismiss, onSuccess }: AppInstallationHandlerParams) => {
	const dispatchToastMessage = useToastMessageDispatch();
	const setModal = useSetModal();

	const appCountQuery = useAppsCountQuery(useMarketplaceContext());

	const notifyAdminsMutation = useNotifyAdminsMutation();

	const openIncompatibleModal = useOpenIncompatibleModal();

	const closeModal = useEffectEvent(() => {
		setModal(null);
		onDismiss();
	});

	const success = useCallback(
		(appPermissions?: App['permissions']) => {
			setModal(null);
			onSuccess(action, appPermissions);
		},
		[action, onSuccess, setModal],
	);

	const openPermissionModal = useOpenAppPermissionsReviewModal({ app, onCancel: closeModal, onConfirm: success });

	const appsOrchestrator = useAppsOrchestrator();

	const purchasedRef = useRef(app?.isPurchased ?? false);

	return useEffectEvent(async () => {
		if (app?.versionIncompatible) {
			openIncompatibleModal(app, action, closeModal);
			return;
		}

		if (action === 'request') {
			const handleConfirm = (postMessage: Record<string, unknown>) => {
				setModal(null);
				dispatchToastMessage({ type: 'success', message: 'App request submitted' }); // TODO: i18n
				notifyAdminsMutation.mutate({ app, postMessage });
				success();
			};

			try {
				const data = await appsOrchestrator.buildExternalAppRequest(app.id);
				setModal(<IframeModal url={data.url} wrapperHeight='x460' cancel={onDismiss} confirm={handleConfirm} />);
			} catch (error) {
				handleAPIError(error);
			}
			return;
		}

		if (!appCountQuery.data) {
			return;
		}

		const acquireApp = async () => {
			if (action === 'purchase' && !purchasedRef.current) {
				setModal(
					<PurchaseAppModal
						app={app}
						onPurchase={() => {
							purchasedRef.current = true;
							openPermissionModal();
						}}
						onClose={onDismiss}
					/>,
				);
				return;
			}

			openPermissionModal();
		};

		if (appCountQuery.data.hasUnlimitedApps) {
			return acquireApp();
		}

		setModal(<AppInstallationModal appName={app.name} onInstall={acquireApp} onClose={closeModal} />);
	});
};
