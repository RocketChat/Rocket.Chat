import { Box, Button, Icon, Throbber, Tag } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useSetModal, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useState, memo } from 'react';

import { Apps } from '../../../../../../../app/apps/client/orchestrator';
import AppPermissionsReviewModal from '../../../AppPermissionsReviewModal';
import CloudLoginModal from '../../../CloudLoginModal';
import IframeModal from '../../../IframeModal';
import appButtonProps from '../../../helpers/appButtonProps';
import { appStatusSpanProps } from '../../../helpers/appStatusSpanProps';
import handleAPIError from '../../../helpers/handleAPIError';
import handleInstallError from '../../../helpers/handleInstallError';
import { marketplaceActions } from '../../../helpers/marketplaceActions';
import AppStatusPriceDisplay from './AppStatusPriceDisplay';

const AppStatus = ({ app, showStatus = true, isAppDetailsPage, isSubscribed, installed, ...props }) => {
	const t = useTranslation();
	const [loading, setLoading] = useSafely(useState());
	const [isAppPurchased, setPurchased] = useSafely(useState(app?.isPurchased));
	const setModal = useSetModal();

	const { price, purchaseType, pricingPlans } = app;

	const button = appButtonProps(app || {});
	const status = !button && appStatusSpanProps(app);

	const action = button?.action || '';
	const confirmAction = useCallback(
		(permissionsGranted) => {
			setModal(null);

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

	const showAppPermissionsReviewModal = () => {
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

	const checkUserLoggedIn = useMethod('cloud:checkUserLoggedIn');

	const handleClick = async (e) => {
		e.preventDefault();
		e.stopPropagation();

		setLoading(true);

		const isLoggedIn = await checkUserLoggedIn();

		if (!isLoggedIn) {
			setLoading(false);
			setModal(<CloudLoginModal />);
			return;
		}

		if (action === 'purchase' && !isAppPurchased) {
			try {
				const data = await Apps.buildExternalUrl(app.id, app.purchaseType, false);
				setModal(<IframeModal url={data.url} cancel={cancelAction} confirm={showAppPermissionsReviewModal} />);
			} catch (error) {
				handleAPIError(error);
			}
			return;
		}

		showAppPermissionsReviewModal();
	};

	const shouldShowPriceDisplay = isAppDetailsPage && button && button.action !== 'update';

	return (
		<Box {...props}>
			{button && isAppDetailsPage && (
				<Box
					display='flex'
					flexDirection='row'
					alignItems='center'
					justifyContent='center'
					borderRadius='x4'
					invisible={!showStatus && !loading}
				>
					<Button
						secondary={button.label !== 'Update'}
						primary={button.label === 'Update'}
						fontSize='x12'
						fontWeight={700}
						disabled={loading}
						onClick={handleClick}
						pi='x8'
						pb='x6'
						lineHeight='x12'
					>
						{loading ? (
							<Throbber inheritColor />
						) : (
							<>
								{button.icon && <Icon name={button.icon} mie='x8' />}
								{t(button.label.replace(' ', '_'))}
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
			{status && (
				<>
					<Tag variant={status.label === 'Disabled' ? 'secondary-danger' : ''}>{status.label}</Tag>
				</>
			)}
		</Box>
	);
};

export default memo(AppStatus);
