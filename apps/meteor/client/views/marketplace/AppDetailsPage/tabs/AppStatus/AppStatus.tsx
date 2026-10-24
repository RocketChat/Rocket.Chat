import type { App } from '@rocket.chat/core-typings';
import { Box, Button, Tag, Icon, Stack } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useRouteParameter, usePermission, useSetModal } from '@rocket.chat/ui-contexts';
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

export type AppStatusProps = {
	app: App;
	showStatus?: boolean;
	isAppDetailsPage: boolean;
	installed?: boolean;
};

const AppStatus = ({ app, showStatus = true, isAppDetailsPage, installed, ...props }: AppStatusProps) => {
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
	const shouldShowPriceDisplay = isAppDetailsPage && button && !app.isEnterpriseOnly && !installed;
	const canUpdate = installed && app?.version && app?.marketplaceVersion && semver.lt(app?.version, app?.marketplaceVersion);

	const { data } = useIsEnterprise();
	const isEnterprise = data?.isEnterprise ?? false;

	const appAddon = app.addon;
	const { data: workspaceHasAddon = false } = useHasLicenseModule(appAddon);

	const statuses = appMultiStatusProps(app, isAppDetailsPage, context || '', isEnterprise);

	const totalSeenRequests = app?.appRequestStats?.totalSeen;
	const totalUnseenRequests = app?.appRequestStats?.totalUnseen;

	const action = button?.action;

	const marketplaceActions = useMarketplaceActions();

	const confirmAction = useCallback<AppInstallationHandlerParams['onSuccess']>(
		async (action, permissionsGranted) => {
			try {
				if (action) {
					if (action !== 'request') {
						await marketplaceActions[action]({ ...app, permissionsGranted });
					} else {
						setEndUserRequested(true);
					}
				}
			} finally {
				setLoading(false);
			}
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

	const getStatusVariant = (status: appStatusSpanResponseProps) => {
		if (isAppRequestsPage && totalUnseenRequests && status.type === 'primary') {
			return 'primary';
		}

		if (status.type === 'danger') {
			return 'secondary-danger';
		}

		return undefined;
	};

	const getStatusFontColor = (status: appStatusSpanResponseProps) => {
		if (status.type === 'warning') {
			return 'status-font-on-warning';
		}

		if (status.type === 'danger') {
			return 'status-font-on-danger';
		}

		return 'font-default';
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
		<Box {...props} display='flex' alignItems='center' marginInlineEnd={8}>
			{button && isAppDetailsPage && (!installed || canUpdate) && (
				<Box
					display='flex'
					flexDirection='row'
					alignItems='center'
					justifyContent='center'
					borderRadius='medium'
					gap={12}
					paddingInlineEnd={shouldShowPriceDisplay ? 4 : undefined}
					invisible={!showStatus && !loading}
				>
					<Button
						icon={button.icon}
						primary
						small
						loading={loading}
						disabled={action === 'request' && (app?.requestedEndUser || endUserRequested)}
						onClick={handleAcquireApp}
					>
						{t(button.label)}
					</Button>

					{shouldShowPriceDisplay && (
						<AppStatusPriceDisplay purchaseType={purchaseType} pricingPlans={pricingPlans} price={price} showType={false} />
					)}
				</Box>
			)}

			<Stack direction='row' align='center' gap={8}>
				{statuses?.map((status, index) => (
					<Tag
						key={index}
						data-qa-type='app-status-tag'
						variant={getStatusVariant(status)}
						title={status.tooltipText ? status.tooltipText : ''}
					>
						<Box display='flex' color={getStatusFontColor(status)} alignItems='center' gap='x4'>
							{status.icon && <Icon name={status.icon} size={16} />}
							{handleAppRequestsNumber(status)} {t(status.label)}
						</Box>
					</Tag>
				))}
			</Stack>
		</Box>
	);
};

export default memo(AppStatus);
