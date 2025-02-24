import type { App } from '@rocket.chat/core-typings';
import { Box, Button, Tag, Margins } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useRouteParameter, usePermission, useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useCallback, useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import semver from 'semver';

import AppStatusPriceDisplay from './AppStatusPriceDisplay';
import { useHasLicenseModule } from '../../../../../hooks/useHasLicenseModule';
import { useIsEnterprise } from '../../../../../hooks/useIsEnterprise';
import AddonRequiredModal from '../../../AppsList/AddonRequiredModal';
import type { appStatusSpanResponseProps } from '../../../helpers';
import { appButtonProps, appMultiStatusProps } from '../../../helpers';
import type { AppInstallationHandlerParams } from '../../../hooks/useAppInstallationHandler';
import { useAppInstallationHandler } from '../../../hooks/useAppInstallationHandler';
import { useMarketplaceActions } from '../../../hooks/useMarketplaceActions';

type AppStatusProps = {
	app: App;
	showStatus?: boolean;
	isAppDetailsPage: boolean;
	installed?: boolean;
};

const AppStatus = ({ app, showStatus = true, isAppDetailsPage, installed, ...props }: AppStatusProps): ReactElement => {
	const { t } = useTranslation();
	const [endUserRequested, setEndUserRequested] = useState(false);
	const [loading, setLoading] = useSafely(useState(false));
	const [isAppPurchased, setPurchased] = useSafely(useState(!!app?.isPurchased));
	const setModal = useSetModal();
	const isAdminUser = usePermission('manage-apps');
	const context = useRouteParameter('context');

	const { price, purchaseType, pricingPlans } = app;

	const button = appButtonProps({ ...app, isAdminUser, endUserRequested });
	const isAppRequestsPage = context === 'requested';
	const shouldShowPriceDisplay = isAppDetailsPage && button && !app.isEnterpriseOnly;
	const canUpdate = installed && app?.version && app?.marketplaceVersion && semver.lt(app?.version, app?.marketplaceVersion);

	const { data } = useIsEnterprise();
	const isEnterprise = data?.isEnterprise ?? false;

	const appAddon = app.addon;
	const workspaceHasAddon = useHasLicenseModule(appAddon);

	const statuses = appMultiStatusProps(app, isAppDetailsPage, context || '', isEnterprise);

	const totalSeenRequests = app?.appRequestStats?.totalSeen;
	const totalUnseenRequests = app?.appRequestStats?.totalUnseen;

	const action = button?.action;

	const marketplaceActions = useMarketplaceActions();

	const confirmAction = useCallback<AppInstallationHandlerParams['onSuccess']>(
		async (action, permissionsGranted) => {
			if (action) {
				if (action !== 'request') {
					await marketplaceActions[action]({ ...app, permissionsGranted });
				} else {
					setEndUserRequested(true);
				}
			}

			setLoading(false);
		},
		[app, marketplaceActions, setLoading],
	);

	const cancelAction = useCallback(() => {
		setLoading(false);
		setModal(null);
	}, [setLoading, setModal]);

	const appInstallationHandler = useAppInstallationHandler({
		app,
		action: action || 'purchase',
		isAppPurchased,
		onDismiss: cancelAction,
		onSuccess: confirmAction,
		setIsPurchased: setPurchased,
	});

	const handleAcquireApp = useCallback(() => {
		setLoading(true);

		if (isAdminUser && appAddon && !workspaceHasAddon) {
			const actionType = button?.action === 'update' ? 'update' : 'install';
			return setModal(<AddonRequiredModal actionType={actionType} onDismiss={cancelAction} onInstallAnyway={appInstallationHandler} />);
		}

		appInstallationHandler();
	}, [button?.action, appAddon, appInstallationHandler, cancelAction, isAdminUser, setLoading, setModal, workspaceHasAddon]);

	// @TODO we should refactor this to not use the label to determine the variant
	const getStatusVariant = (status: appStatusSpanResponseProps) => {
		if (isAppRequestsPage && totalUnseenRequests && (status.label === 'request' || status.label === 'requests')) {
			return 'primary';
		}

		if (isAppRequestsPage && status.label === 'Requested') {
			return undefined;
		}

		// includes() here because the label can be 'Disabled' or 'Disabled*'
		if (status.label.includes('Disabled')) {
			return 'secondary-danger';
		}

		return undefined;
	};

	const handleAppRequestsNumber = (status: appStatusSpanResponseProps) => {
		if ((status.label === 'request' || status.label === 'requests') && !installed && isAppRequestsPage) {
			let numberOfRequests = 0;

			if (totalUnseenRequests >= 0) {
				numberOfRequests += totalUnseenRequests;
			}

			if (totalSeenRequests >= 0) {
				numberOfRequests += totalSeenRequests;
			}

			return numberOfRequests;
		}

		return null;
	};

	return (
		<Box {...props} display='flex' alignItems='center' mie={8}>
			{button && isAppDetailsPage && (!installed || canUpdate) && (
				<Box
					display='flex'
					flexDirection='row'
					alignItems='center'
					justifyContent='center'
					borderRadius='x4'
					invisible={!showStatus && !loading}
				>
					<Button
						icon={button.icon}
						primary
						small
						loading={loading}
						disabled={action === 'request' && (app?.requestedEndUser || endUserRequested)}
						onClick={handleAcquireApp}
						mie={8}
					>
						{t(button.label.replace(' ', '_') as TranslationKey)}
					</Button>

					{shouldShowPriceDisplay && !installed && (
						<AppStatusPriceDisplay purchaseType={purchaseType} pricingPlans={pricingPlans} price={price} showType={false} />
					)}
				</Box>
			)}

			{statuses?.map((status, index) => (
				<Margins inlineEnd={index !== statuses.length - 1 ? 8 : undefined} key={index}>
					<Tag data-qa-type='app-status-tag' variant={getStatusVariant(status)} title={status.tooltipText ? status.tooltipText : ''}>
						{handleAppRequestsNumber(status)} {t(status.label)}
					</Tag>
				</Margins>
			))}
		</Box>
	);
};

export default memo(AppStatus);
