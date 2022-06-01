import { Box, Button, Icon, Throbber } from '@rocket.chat/fuselage';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import colors from '@rocket.chat/fuselage-tokens/colors.json';
import { useSetModal, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback, useState, memo } from 'react';

import { Apps } from '../../../../app/apps/client/orchestrator';
import AppPermissionsReviewModal from './AppPermissionsReviewModal';
import CloudLoginModal from './CloudLoginModal';
import IframeModal from './IframeModal';
import PriceDisplay from './PriceDisplay';
import { appButtonProps, appStatusSpanProps, handleAPIError, warnStatusChange, handleInstallError } from './helpers';

const installApp = async ({ id, name, version, permissionsGranted }) => {
	try {
		const { status } = await Apps.installApp(id, version, permissionsGranted);
		warnStatusChange(name, status);
	} catch (error) {
		handleAPIError(error);
	}
};

const actions = {
	purchase: installApp,
	install: installApp,
	update: async ({ id, name, marketplaceVersion, permissionsGranted }) => {
		try {
			const { status } = await Apps.updateApp(id, marketplaceVersion, permissionsGranted);
			warnStatusChange(name, status);
		} catch (error) {
			handleAPIError(error);
		}
	},
};

const AppStatus = ({ app, showStatus = true, isAppDetailsPage, installed = false, ...props }) => {
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

			actions[action]({ ...app, permissionsGranted }).then(() => {
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

		return setModal(<AppPermissionsReviewModal appPermissions={app.permissions} cancel={cancelAction} confirm={confirmAction} />);
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

	const AppStatusStyle = {
		bg: status.label === 'Disabled' ? colors.y100 : colors.b100,
		color: status.label === 'Disabled' ? colors.y800 : 'primary-500',
	};

	return (
		<Box {...props}>
			{button && (
				<Box
					bg={colors.b100}
					display='flex'
					flexDirection='row'
					alignItems='center'
					justifyContent='center'
					borderRadius='x2'
					invisible={!showStatus && !loading}
				>
					<Button primary disabled={loading} minHeight='x40' onClick={handleClick}>
						{loading ? (
							<Throbber inheritColor />
						) : (
							<>
								{button.icon && <Icon name={button.icon} />}
								{t(button.label)}
							</>
						)}
					</Button>
					{isAppDetailsPage && (
						<Box pi='x14' color='primary-500'>
							{!installed && (
								<PriceDisplay purchaseType={purchaseType} pricingPlans={pricingPlans} price={price} showType={false} marginInline='x8' />
							)}
						</Box>
					)}
				</Box>
			)}
			{status && (
				<Box display='flex' alignItems='center' pi='x14' pb='x8' bg={AppStatusStyle.bg} color={AppStatusStyle.color}>
					<Icon size='x20' name={status.icon} mie='x4' />
					{t(status.label)}
				</Box>
			)}
		</Box>
	);
};

export default memo(AppStatus);
