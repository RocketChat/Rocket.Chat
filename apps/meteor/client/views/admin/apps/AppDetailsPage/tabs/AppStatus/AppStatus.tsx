import type { App } from '@rocket.chat/core-typings';
import { Box, Button, Icon, Throbber, Tag, Margins } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import type { TranslationKey } from '@rocket.chat/ui-contexts';
import { useSetModal, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React, { useCallback, useState, memo, Fragment } from 'react';

import { Apps } from '../../../../../../../app/apps/client/orchestrator';
import AppPermissionsReviewModal from '../../../AppPermissionsReviewModal';
import CloudLoginModal from '../../../CloudLoginModal';
import IframeModal from '../../../IframeModal';
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
	const button = appButtonProps(app || {});
	const statuses = appMultiStatusProps(app, isAppDetailsPage);

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

			marketplaceActions[action]({ ...app, permissionsGranted }).then(() => {
				setLoading(false);
			});
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

		const isLoggedIn = await checkUserLoggedIn();

		if (!isLoggedIn) {
			setLoading(false);
			setModal(<CloudLoginModal />);
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

	const shouldShowPriceDisplay = isAppDetailsPage && button;

	return (
		<Box {...props} display='flex' mis='x4'>
			{button && isAppDetailsPage && (
				<Box
					display='flex'
					flexDirection='row'
					alignItems='center'
					justifyContent='center'
					borderRadius='x4'
					invisible={!showStatus && !loading}
				>
					<Button primary fontSize='x12' fontWeight={700} disabled={loading} onClick={handleClick} pi='x8' pb='x6' lineHeight='x14'>
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
						<Box mis='x8'>
							<AppStatusPriceDisplay purchaseType={purchaseType} pricingPlans={pricingPlans} price={price} showType={false} />
						</Box>
					)}
				</Box>
			)}

			{statuses?.map((status, index) => (
				<Fragment key={index}>
					<Margins all='x8'>
						{status.tooltipText ? (
							<Tag title={status.tooltipText} variant={status.label === 'Disabled' ? 'secondary-danger' : undefined}>
								{status.label}
							</Tag>
						) : (
							<Box is='span'>
								<Tag variant={status.label === 'Disabled' ? 'secondary-danger' : undefined}>{status.label}</Tag>
							</Box>
						)}
					</Margins>
				</Fragment>
			))}
		</Box>
	);
};

export default memo(AppStatus);
