import type { App } from '@rocket.chat/core-typings';
import { Box, Button, Icon, Throbber, Tag, Margins } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useRouteParameter, usePermission, useSetModal, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useState, memo, Fragment } from 'react';

import { Apps } from '../../../../../../app/apps/client/orchestrator';
import AppPermissionsReviewModal from '../../../AppPermissionsReviewModal';
import CloudLoginModal from '../../../CloudLoginModal';
import IframeModal from '../../../IframeModal';
import type { appStatusSpanResponseProps } from '../../../helpers';
import { appButtonProps, appMultiStatusProps, handleAPIError, handleInstallError } from '../../../helpers';
import { marketplaceActions } from '../../../helpers/marketplaceActions';
import AppStatusPriceDisplay from './AppStatusPriceDisplay';

type AppStatusProps = {
	app: App;
	showStatus?: boolean;
	isAppDetailsPage: boolean;
	installed?: boolean;
};

const AppStatus = ({ app, showStatus = true, isAppDetailsPage, installed, ...props }: AppStatusProps): ReactElement => {
	const t = useTranslation();
	const [loading, setLoading] = useSafely(useState(false));
	const [isAppPurchased, setPurchased] = useSafely(useState(app?.isPurchased));
	const setModal = useSetModal();
	const { price, purchaseType, pricingPlans } = app;
	const isAdminUser = usePermission('manage-apps');
	const button = appButtonProps({ ...app, isAdminUser });
	const context = useRouteParameter('context');

	const statuses = appMultiStatusProps(app, isAppDetailsPage, context || '');

	const totalSeenRequests = app?.appRequestStats?.totalSeen;
	const totalUnseenRequests = app?.appRequestStats?.totalUnseen;

	if (button?.action === undefined && button?.action) {
		throw new Error('action must not be null');
	}

	const action = button?.action;
	const confirmAction = useCallback(
		(permissionsGranted) => {
			setModal(null);

			if (action === undefined) {
				setLoading(false);
				return;
			}

			if (action !== 'request') {
				marketplaceActions[action]({ ...app, permissionsGranted }).then(() => {
					setLoading(false);
				});
			}
		},
		[setModal, action, app, setLoading],
	);

	const cancelAction = useCallback(() => {
		setLoading(false);
		setModal(null);
	}, [setLoading, setModal]);

	const showAppPermissionsReviewModal = (): void => {
		if (!isAppPurchased) {
			setPurchased(true);
		}

		if (!app.permissions || app.permissions.length === 0) {
			return confirmAction(app.permissions);
		}

		if (!Array.isArray(app.permissions)) {
			handleInstallError(new Error('The "permissions" property from the app manifest is invalid'));
		}

		return setModal(<AppPermissionsReviewModal appPermissions={app.permissions} onCancel={cancelAction} onConfirm={confirmAction} />);
	};

	const openIncompatibleModal = async (app: App, action: string, cancel: () => void): Promise<void> => {
		try {
			const incompatibleData = await Apps.buildIncompatibleExternalUrl(app.id, app.marketplaceVersion, action);
			setModal(<IframeModal url={incompatibleData.url} cancel={cancel} confirm={cancel} />);
		} catch (e: any) {
			handleAPIError(e);
		}
	};

	const openPurchaseModal = async (app: App): Promise<void> => {
		try {
			const data = await Apps.buildExternalUrl(app.id, app.purchaseType, false);
			setModal(<IframeModal url={data.url} cancel={cancelAction} confirm={showAppPermissionsReviewModal} />);
		} catch (error) {
			handleAPIError(error);
		}
	};

	const checkUserLoggedIn = useMethod('cloud:checkUserLoggedIn');

	const handleClick = async (e: React.MouseEvent<HTMLElement>): Promise<void> => {
		e.preventDefault();
		e.stopPropagation();

		setLoading(true);

		let isLoggedIn = true;
		if (action !== 'request') {
			isLoggedIn = await checkUserLoggedIn();
		}

		if (!isLoggedIn) {
			setLoading(false);
			setModal(<CloudLoginModal />);
			return;
		}

		if (action === 'request') {
			try {
				const data = await Apps.buildExternalAppRequest(app.id);
				setModal(<IframeModal url={data?.url} cancel={cancelAction} confirm={undefined} />);
			} catch (error) {
				handleAPIError(error);
			}
			return;
		}

		if (app.versionIncompatible && action !== undefined) {
			openIncompatibleModal(app, action, cancelAction);
			return;
		}

		if (action !== undefined && action === 'purchase' && !isAppPurchased) {
			openPurchaseModal(app);
			return;
		}

		showAppPermissionsReviewModal();
	};

	const getStatusVariant = (status: appStatusSpanResponseProps) => {
		if (context === 'requested' && totalUnseenRequests && (status.label === 'request' || status.label === 'requests')) {
			return 'primary';
		}

		if (status.label === 'Disabled') {
			return 'secondary-danger';
		}

		return undefined;
	};

	const shouldShowPriceDisplay = isAppDetailsPage && button;

	return (
		<Box {...props} display='flex' alignItems='center'>
			{button && isAppDetailsPage && !installed && (
				<Box
					display='flex'
					flexDirection='row'
					alignItems='center'
					justifyContent='center'
					borderRadius='x4'
					invisible={!showStatus && !loading}
				>
					<Button primary small disabled={loading} onClick={handleClick} mie='x8'>
						{loading ? (
							<Throbber inheritColor />
						) : (
							<>
								{button.icon && <Icon name={button.icon} size='x16' mie='x4' />}
								{t(button.label.replace(' ', '_') as TranslationKey)}
							</>
						)}
					</Button>

					{shouldShowPriceDisplay && !installed && (
						<AppStatusPriceDisplay purchaseType={purchaseType} pricingPlans={pricingPlans} price={price} showType={false} />
					)}
				</Box>
			)}

			{statuses?.map((status, index) => (
				<Margins inlineEnd='x8' key={index}>
					<Tag variant={getStatusVariant(status)} title={status.tooltipText ? status.tooltipText : ''}>
						{context === 'requested' && totalUnseenRequests ? totalUnseenRequests : totalSeenRequests}{' '}
						{t(`${status.label}` as TranslationKey)}
					</Tag>
				</Margins>
			))}
		</Box>
	);
};

export default memo(AppStatus);
