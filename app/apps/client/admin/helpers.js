import { FlowRouter } from 'meteor/kadira:flow-router';
import semver from 'semver';
import toastr from 'toastr';

import { modal, popover, call } from '../../../ui-utils/client';
import { t } from '../../../utils/client';
import { Apps } from '../orchestrator';

// TODO: get this list from Apps Engine
export const AppStatus = Object.freeze({
	UNKNOWN: 'unknown',
	CONSTRUCTED: 'constructed',
	INITIALIZED: 'initialized',
	AUTO_ENABLED: 'auto_enabled',
	MANUALLY_ENABLED: 'manually_enabled',
	COMPILER_ERROR_DISABLED: 'compiler_error_disabled',
	INVALID_LICENSE_DISABLED: 'invalid_license_disabled',
	ERROR_DISABLED: 'error_disabled',
	MANUALLY_DISABLED: 'manually_disabled',
	INVALID_SETTINGS_DISABLED: 'invalid_settings_disabled',
	DISABLED: 'disabled',
});

const appEnabledStatuses = [
	AppStatus.AUTO_ENABLED,
	AppStatus.MANUALLY_ENABLED,
];

const appErroredStatuses = [
	AppStatus.COMPILER_ERROR_DISABLED,
	AppStatus.ERROR_DISABLED,
	AppStatus.MANUALLY_DISABLED,
	AppStatus.INVALID_SETTINGS_DISABLED,
	AppStatus.INVALID_LICENSE_DISABLED,
	AppStatus.DISABLED,
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

const promptModifySubscription = async (app, callback, cancelCallback) => {
	let data = null;
	try {
		data = await Apps.buildExternalUrl(app.id, app.purchaseType, true);
	} catch (e) {
		handleAPIError(e);
		cancelCallback();
		return;
	}

	modal.open({
		allowOutsideClick: false,
		data,
		template: 'iframeModal',
	}, callback, cancelCallback);
};

const promptAppDeactivation = (callback) => {
	modal.open({
		text: t('Apps_Marketplace_Deactivate_App_Prompt'),
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#DD6B55',
		confirmButtonText: t('Yes'),
		cancelButtonText: t('No'),
		closeOnConfirm: true,
		html: false,
	}, (confirmed) => {
		if (!confirmed) {
			return;
		}
		callback();
	});
};

const promptAppUninstall = (callback) => {
	modal.open({
		text: t('Apps_Marketplace_Uninstall_App_Prompt'),
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#DD6B55',
		confirmButtonText: t('Yes'),
		cancelButtonText: t('No'),
		closeOnConfirm: true,
		html: false,
	}, (confirmed) => {
		if (!confirmed) {
			return;
		}
		callback();
	});
};

export const triggerAppPopoverMenu = (app, currentTarget, instance) => {
	if (!app) {
		return;
	}

	const handleSubscription = () => promptModifySubscription(app, async () => {
		try {
			await Apps.syncApp(app.id);
		} catch (error) {
			handleAPIError(error);
		}
	});

	const handleViewLogs = () => {
		FlowRouter.go('app-logs', { appId: app.id }, { version: app.version });
	};

	const handleDisable = () => promptAppDeactivation(async () => {
		try {
			const effectiveStatus = await Apps.disableApp(app.id);
			warnStatusChange(app.name, effectiveStatus);
		} catch (error) {
			handleAPIError(error);
		}
	});

	const handleEnable = async () => {
		try {
			const effectiveStatus = await Apps.enableApp(app.id);
			warnStatusChange(app.name, effectiveStatus);
		} catch (error) {
			handleAPIError(error);
		}
	};

	const handleUninstall = () => promptAppUninstall(async () => {
		try {
			await Apps.uninstallApp(app.id);
		} catch (error) {
			handleAPIError(error);
		}
	});

	const canAppBeSubscribed = app.purchaseType === 'subscription';
	const isAppEnabled = appEnabledStatuses.includes(app.status);

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

export const promptMarketplaceLogin = () => {
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
			FlowRouter.go('cloud-config');
		}
	});
};

export const appButtonProps = ({
	installed,
	version,
	marketplaceVersion,
	isPurchased,
	isSubscribed,
	price,
	purchaseType,
	subscriptionInfo,
}) => {
	const canUpdate = () =>
		installed
		&& version && marketplaceVersion
		&& semver.lt(version, marketplaceVersion)
		&& (isPurchased || price <= 0);
	const canDownload = () => !installed && (isPurchased || isSubscribed);
	const canTrial = () => !installed && (purchaseType === 'subscription' && !subscriptionInfo.status);
	const canBuy = () => !installed && price > 0;
	const canGet = () => !installed;

	if (canUpdate()) {
		return {
			action: 'update',
			icon: 'reload',
			label: 'Update',
		};
	}

	if (canDownload()) {
		return {
			action: 'install',
			label: 'Install',
		};
	}

	if (canTrial()) {
		return {
			action: 'purchase',
			label: 'Trial',
		};
	}

	if (canBuy()) {
		return {
			action: 'purchase',
			label: 'Buy',
		};
	}

	if (canGet()) {
		return {
			action: 'purchase',
			label: 'Install',
		};
	}
};

export const appStatusSpanProps = ({
	installed,
	status,
	subscriptionInfo,
}) => {
	const isFailed = () => installed && ['invalid_license_disabled'].includes(status); // TODO
	const isEnabled = () => appEnabledStatuses.includes(status);
	const isOnTrialPeriod = () => subscriptionInfo && subscriptionInfo.status === 'trialing';

	if (isFailed()) {
		return {
			type: 'failed',
			icon: 'warning',
			label: 'Failed',
		};
	}

	if (!installed) {
		return;
	}

	if (isOnTrialPeriod()) {
		return {
			icon: 'checkmark-circled',
			label: 'Trial period',
		};
	}

	if (!isEnabled()) {
		return {
			type: 'warning',
			icon: 'warning',
			label: 'Disabled',
		};
	}

	return {
		icon: 'checkmark-circled',
		label: 'Enabled',
	};
};

export const formatPrice = (price) => `\$${ Number.parseFloat(price).toFixed(2) }`;

export const formatPricingPlan = (pricingPlan) => {
	const perUser = pricingPlan.isPerSeat && pricingPlan.tiers && pricingPlan.tiers.length;

	const pricingPlanTranslationString = [
		'Apps_Marketplace_pricingPlan',
		pricingPlan.strategy,
		perUser && 'perUser',
	].filter(Boolean).join('_');

	return t(pricingPlanTranslationString, {
		price: formatPrice(pricingPlan.price),
	});
};

export const checkCloudLogin = async () => {
	try {
		return await call('cloud:checkUserLoggedIn');
	} catch (error) {
		handleAPIError(error);
		return false;
	}
};
