import { Box, Icon, Menu } from '@rocket.chat/fuselage';
import { useSetModal, useMethod, useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useCallback } from 'react';

import CloudLoginModal from './CloudLoginModal';
import IframeModal from './IframeModal';
import WarningModal from './WarningModal';
import { appEnabledStatuses, warnStatusChange, handleAPIError } from './helpers';

function AppMenu({ app, ...props }) {
	const t = useTranslation();
	const setModal = useSetModal();
	const checkUserLoggedIn = useMethod('cloud:checkUserLoggedIn');

	const setAppStatus = useEndpoint('POST', `/apps/${app.id}/status`);
	const buildExternalUrl = useEndpoint('GET', '/apps');
	const syncApp = useEndpoint('POST', `/apps/${app.id}/sync`);
	const uninstallApp = useEndpoint('DELETE', `/apps/${app.id}`);

	const canAppBeSubscribed = app.purchaseType === 'subscription';
	const isSubscribed = app.subscriptionInfo && ['active', 'trialing'].includes(app.subscriptionInfo.status);
	const isAppEnabled = appEnabledStatuses.includes(app.status);

	const closeModal = useCallback(() => {
		setModal(null);
	}, [setModal]);

	const handleEnable = useCallback(async () => {
		try {
			const { status } = await setAppStatus({ status: 'manually_enabled' });
			warnStatusChange(app.name, status);
		} catch (error) {
			handleAPIError(error);
		}
	}, [app.name, setAppStatus]);

	const handleSubscription = useCallback(async () => {
		if (!(await checkUserLoggedIn())) {
			setModal(<CloudLoginModal />);
			return;
		}

		let data;
		try {
			data = await buildExternalUrl({
				buildExternalUrl: 'true',
				appId: app.id,
				purchaseType: app.purchaseType,
				details: true,
			});
		} catch (error) {
			handleAPIError(error);
			return;
		}

		const confirm = async () => {
			try {
				await syncApp();
			} catch (error) {
				handleAPIError(error);
			}
		};

		setModal(<IframeModal url={data.url} confirm={confirm} cancel={closeModal} />);
	}, [checkUserLoggedIn, setModal, closeModal, buildExternalUrl, app.id, app.purchaseType, syncApp]);

	const handleDisable = useCallback(() => {
		const confirm = async () => {
			closeModal();
			try {
				const { status } = await setAppStatus({ status: 'manually_disabled' });
				warnStatusChange(app.name, status);
			} catch (error) {
				handleAPIError(error);
			}
		};
		setModal(
			<WarningModal close={closeModal} confirm={confirm} text={t('Apps_Marketplace_Deactivate_App_Prompt')} confirmText={t('Yes')} />,
		);
	}, [app.name, closeModal, setAppStatus, setModal, t]);

	const handleUninstall = useCallback(() => {
		const uninstall = async () => {
			closeModal();
			try {
				await uninstallApp();
			} catch (error) {
				handleAPIError(error);
			}
		};

		if (isSubscribed) {
			const confirm = async () => {
				await handleSubscription();
			};

			setModal(
				<WarningModal
					close={closeModal}
					cancel={uninstall}
					confirm={confirm}
					text={t('Apps_Marketplace_Uninstall_Subscribed_App_Prompt')}
					confirmText={t('Apps_Marketplace_Modify_App_Subscription')}
					cancelText={t('Apps_Marketplace_Uninstall_Subscribed_App_Anyway')}
				/>,
			);
		}

		setModal(
			<WarningModal close={closeModal} confirm={uninstall} text={t('Apps_Marketplace_Uninstall_App_Prompt')} confirmText={t('Yes')} />,
		);
	}, [closeModal, handleSubscription, isSubscribed, setModal, t, uninstallApp]);

	const menuOptions = useMemo(
		() => ({
			...(canAppBeSubscribed && {
				subscribe: {
					label: (
						<Box>
							<Icon name='card' size='x16' marginInlineEnd='x4' />
							{t('Subscription')}
						</Box>
					),
					action: handleSubscription,
				},
			}),
			...(app.installed &&
				isAppEnabled && {
					disable: {
						label: (
							<Box color='warning'>
								<Icon name='ban' size='x16' marginInlineEnd='x4' />
								{t('Disable')}
							</Box>
						),
						action: handleDisable,
					},
				}),
			...(app.installed &&
				!isAppEnabled && {
					enable: {
						label: (
							<Box>
								<Icon name='check' size='x16' marginInlineEnd='x4' />
								{t('Enable')}
							</Box>
						),
						action: handleEnable,
					},
				}),
			...(app.installed && {
				uninstall: {
					label: (
						<Box color='danger'>
							<Icon name='trash' size='x16' marginInlineEnd='x4' />
							{t('Uninstall')}
						</Box>
					),
					action: handleUninstall,
				},
			}),
		}),
		[canAppBeSubscribed, t, handleSubscription, app.installed, isAppEnabled, handleDisable, handleEnable, handleUninstall],
	);

	return <Menu options={menuOptions} placement='bottom-start' {...props} />;
}

export default AppMenu;
