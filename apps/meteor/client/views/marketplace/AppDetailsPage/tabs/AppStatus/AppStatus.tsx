import type { App } from '@rocket.chat/core-typings';
import { Box, Button, Throbber, Tag, Margins } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useRouteParameter, usePermission, useSetModal, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useState, memo } from 'react';
import semver from 'semver';

import { useIsEnterprise } from '../../../../../hooks/useIsEnterprise';
import type { appStatusSpanResponseProps } from '../../../helpers';
import { appButtonProps, appMultiStatusProps } from '../../../helpers';
import { marketplaceActions } from '../../../helpers/marketplaceActions';
import type { AppInstallationHandlerParams } from '../../../hooks/useAppInstallationHandler';
import { useAppInstallationHandler } from '../../../hooks/useAppInstallationHandler';
import AppStatusPriceDisplay from './AppStatusPriceDisplay';

type AppStatusProps = {
	app: App;
	showStatus?: boolean;
	isAppDetailsPage: boolean;
	installed?: boolean;
};

const AppStatus = ({ app, showStatus = true, isAppDetailsPage, installed, ...props }: AppStatusProps): ReactElement => {
	const t = useTranslation();
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

	const statuses = appMultiStatusProps(app, isAppDetailsPage, context || '', isEnterprise);

	const totalSeenRequests = app?.appRequestStats?.totalSeen;
	const totalUnseenRequests = app?.appRequestStats?.totalUnseen;

	const action = button?.action;

	const confirmAction = useCallback<AppInstallationHandlerParams['onSuccess']>(
		async (action, permissionsGranted) => {
			if (action !== 'request') {
				setPurchased(true);
				await marketplaceActions[action]({ ...app, permissionsGranted });
			} else {
				setEndUserRequested(true);
			}

			setLoading(false);
		},
		[app, setLoading, setPurchased],
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
	});

	const handleAcquireApp = useCallback(() => {
		setLoading(true);
		appInstallationHandler();
	}, [appInstallationHandler, setLoading]);

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
						icon={!loading && button.icon ? button.icon : undefined}
						primary
						small
						disabled={loading || (action === 'request' && (app?.requestedEndUser || endUserRequested))}
						onClick={handleAcquireApp}
						mie={8}
					>
						{loading && <Throbber inheritColor />}
						{!loading && t(button.label.replace(' ', '_') as TranslationKey)}
					</Button>

					{shouldShowPriceDisplay && !installed && (
						<AppStatusPriceDisplay purchaseType={purchaseType} pricingPlans={pricingPlans} price={price} showType={false} />
					)}
				</Box>
			)}

			{statuses?.map((status, index) => (
				<Margins inlineEnd={8} key={index}>
					<Tag variant={getStatusVariant(status)} title={status.tooltipText ? status.tooltipText : ''}>
						{handleAppRequestsNumber(status)} {t(`${status.label}` as TranslationKey)}
					</Tag>
				</Margins>
			))}
		</Box>
	);
};

export default memo(AppStatus);
