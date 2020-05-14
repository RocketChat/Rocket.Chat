import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import { FlowRouter } from 'meteor/kadira:flow-router';
import semver from 'semver';
import toastr from 'toastr';

import { modal, popover, call } from '../../../ui-utils/client';
import { t } from '../../../utils/client';
import { Apps } from '../orchestrator';

const appEnabledStatuses = [
	AppStatus.AUTO_ENABLED,
	AppStatus.MANUALLY_ENABLED,
];

const appErroredStatuses = [
	AppStatus.COMPILER_ERROR_DISABLED,
	AppStatus.ERROR_DISABLED,
	AppStatus.INVALID_SETTINGS_DISABLED,
	AppStatus.INVALID_LICENSE_DISABLED,
];

export const handleAPIError = (error) => {
	console.error(error);
	const message = (error.xhr && error.xhr.responseJSON && error.xhr.responseJSON.error) || error.message;
	toastr.error(message);
};

export const warnStatusChange = (appName, status) => {
	if (appErroredStatuses.includes(status)) {
		toastr.error(t(`App_status_${ status }`), appName);
		return;
	}

	toastr.info(t(`App_status_${ status }`), appName);
};

const promptCloudLogin = () => {
	modal.open({
		title: t('Apps_Marketplace_Login_Required_Title'),
		text: t('Apps_Marketplace_Login_Required_Description'),
		type: 'info',
		showCancelButton: true,
		confirmButtonColor: '#DD6B55',
		confirmButtonText: t('Login'),
		cancelButtonText: t('Cancel'),
		closeOnConfirm: true,
		html: false,
	}, (confirmed) => {
		if (confirmed) {
			FlowRouter.go('cloud');
		}
	});
};

export const checkCloudLogin = async () => {
	try {
		const isLoggedIn = await call('cloud:checkUserLoggedIn');

		if (!isLoggedIn) {
			promptCloudLogin();
		}

		return isLoggedIn;
	} catch (error) {
		handleAPIError(error);
		return false;
	}
};

export const promptSubscription = async (app, callback, cancelCallback) => {
	let data = null;
	try {
		data = await Apps.buildExternalUrl(app.id, app.purchaseType, false);
	} catch (error) {
		handleAPIError(error);
		cancelCallback();
		return;
	}

	modal.open({
		allowOutsideClick: false,
		data,
		template: 'iframeModal',
	}, callback, cancelCallback);
};

const promptModifySubscription = async ({ id, purchaseType }) => {
	if (!await checkCloudLogin()) {
		return;
	}

	let data = null;
	try {
		data = await Apps.buildExternalUrl(id, purchaseType, true);
	} catch (error) {
		handleAPIError(error);
		return;
	}

	await new Promise((resolve) => {
		modal.open({
			allowOutsideClick: false,
			data,
			template: 'iframeModal',
		}, resolve);
	});
};

const promptAppDeactivation = () => new Promise((resolve) => {
	modal.open({
		text: t('Apps_Marketplace_Deactivate_App_Prompt'),
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#DD6B55',
		confirmButtonText: t('Yes'),
		cancelButtonText: t('No'),
		closeOnConfirm: true,
		html: false,
	}, resolve, () => resolve(false));
});

const promptAppUninstall = () => new Promise((resolve) => {
	modal.open({
		text: t('Apps_Marketplace_Uninstall_App_Prompt'),
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#DD6B55',
		confirmButtonText: t('Yes'),
		cancelButtonText: t('No'),
		closeOnConfirm: true,
		html: false,
	}, resolve, () => resolve(false));
});

const promptSubscribedAppUninstall = () => new Promise((resolve) => {
	modal.open({
		text: t('Apps_Marketplace_Uninstall_Subscribed_App_Prompt'),
		type: 'info',
		showCancelButton: true,
		confirmButtonText: t('Apps_Marketplace_Modify_App_Subscription'),
		cancelButtonText: t('Apps_Marketplace_Uninstall_Subscribed_App_Anyway'),
		cancelButtonColor: '#DD6B55',
		closeOnConfirm: true,
		html: false,
	}, resolve, () => resolve(false));
});

export const triggerAppPopoverMenu = (app, currentTarget, instance) => {
	if (!app) {
		return;
	}

	const canAppBeSubscribed = app.purchaseType === 'subscription';
	const isSubscribed = app.subscriptionInfo && ['active', 'trialing'].includes(app.subscriptionInfo.status);
	const isAppEnabled = appEnabledStatuses.includes(app.status);

	const handleSubscription = async () => {
		await promptModifySubscription(app);
		try {
			await Apps.syncApp(app.id);
		} catch (error) {
			handleAPIError(error);
		}
	};

	const handleViewLogs = () => {
		FlowRouter.go('app-logs', { appId: app.id }, { version: app.version });
	};

	const handleDisable = async () => {
		if (!await promptAppDeactivation()) {
			return;
		}

		try {
			const effectiveStatus = await Apps.disableApp(app.id);
			warnStatusChange(app.name, effectiveStatus);
		} catch (error) {
			handleAPIError(error);
		}
	};

	const handleEnable = async () => {
		try {
			const effectiveStatus = await Apps.enableApp(app.id);
			warnStatusChange(app.name, effectiveStatus);
		} catch (error) {
			handleAPIError(error);
		}
	};

	const handleUninstall = async () => {
		if (isSubscribed) {
			const modifySubscription = await promptSubscribedAppUninstall();
			if (modifySubscription) {
				await promptModifySubscription(app);
				try {
					await Apps.syncApp(app.id);
				} catch (error) {
					handleAPIError(error);
				}
				return;
			}

			try {
				await Apps.uninstallApp(app.id);
			} catch (error) {
				handleAPIError(error);
			}
			return;
		}

		if (!await promptAppUninstall()) {
			return;
		}
		try {
			await Apps.uninstallApp(app.id);
		} catch (error) {
			handleAPIError(error);
		}
	};

	popover.open({
		currentTarget,
		instance,
		columns: [{
			groups: [
				{
					items: [
						...canAppBeSubscribed ? [{
							icon: 'card',
							name: t('Subscription'),
							action: handleSubscription,
						}] : [],
						{
							icon: 'list-alt',
							name: t('View_Logs'),
							action: handleViewLogs,
						},
					],
				},
				{
					items: [
						isAppEnabled
							? {
								icon: 'ban',
								name: t('Disable'),
								modifier: 'alert',
								action: handleDisable,
							}
							: {
								icon: 'check',
								name: t('Enable'),
								action: handleEnable,
							},
						{
							icon: 'trash',
							name: t('Uninstall'),
							modifier: 'alert',
							action: handleUninstall,
						},
					],
				},
			],
		}],
	});
};

export const appButtonProps = ({
	installed,
	version,
	marketplaceVersion,
	isPurchased,
	price,
	purchaseType,
	subscriptionInfo,
}) => {
	const canUpdate = installed
		&& version && marketplaceVersion
		&& semver.lt(version, marketplaceVersion);
	if (canUpdate) {
		return {
			action: 'update',
			icon: 'reload',
			label: 'Update',
		};
	}

	if (installed) {
		return;
	}

	const canDownload = isPurchased;
	if (canDownload) {
		return {
			action: 'install',
			label: 'Install',
		};
	}

	const canTrial = purchaseType === 'subscription' && !subscriptionInfo.status;
	if (canTrial) {
		return {
			action: 'purchase',
			label: 'Trial',
		};
	}

	const canBuy = price > 0;
	if (canBuy) {
		return {
			action: 'purchase',
			label: 'Buy',
		};
	}

	return {
		action: 'purchase',
		label: 'Install',
	};
};

export const appStatusSpanProps = ({
	installed,
	status,
	subscriptionInfo,
}) => {
	if (!installed) {
		return;
	}

	const isFailed = appErroredStatuses.includes(status);
	if (isFailed) {
		return {
			type: 'failed',
			icon: 'warning',
			label: status === AppStatus.INVALID_SETTINGS_DISABLED ? 'Config Needed' : 'Failed',
		};
	}

	const isEnabled = appEnabledStatuses.includes(status);
	if (!isEnabled) {
		return {
			type: 'warning',
			icon: 'warning',
			label: 'Disabled',
		};
	}

	const isOnTrialPeriod = subscriptionInfo && subscriptionInfo.status === 'trialing';
	if (isOnTrialPeriod) {
		return {
			icon: 'checkmark-circled',
			label: 'Trial period',
		};
	}

	return {
		icon: 'checkmark-circled',
		label: 'Enabled',
	};
};

export const formatPrice = (price) => `\$${ Number.parseFloat(price).toFixed(2) }`;

export const formatPricingPlan = ({ strategy, price, tiers = [] }) => {
	const { perUnit = false } = (Array.isArray(tiers) && tiers.find((tier) => tier.price === price)) || {};

	const pricingPlanTranslationString = [
		'Apps_Marketplace_pricingPlan',
		Array.isArray(tiers) && tiers.length > 0 && 'startingAt',
		strategy,
		perUnit && 'perUser',
	].filter(Boolean).join('_');

	return t(pricingPlanTranslationString, {
		price: formatPrice(price),
	});
};
