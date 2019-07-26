import { FlowRouter } from 'meteor/kadira:flow-router';
import semver from 'semver';
import toastr from 'toastr';

import { modal, popover } from '../../../ui-utils/client';
import { t } from '../../../utils/client';
import { Apps } from '../orchestrator';


export const handleAPIError = (error) => {
	console.error(error);
	const message = (error.xhr && error.xhr.responseJSON && error.xhr.responseJSON.error) || error.message;
	toastr.error(message);
};

export const promptSubscription = async (app, callback, cancelCallback) => {
	let data = null;
	try {
		data = await Apps.buildExternalUrl(app.id, app.purchaseType, false);
	} catch (error) {
		handleAPIError(error);
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

	const handleDeactivate = () => promptAppDeactivation(async () => {
		try {
			await Apps.disableApp(app.id);
		} catch (error) {
			handleAPIError(error);
		}
	});

	const handleActivate = async () => {
		try {
			await Apps.enableApp(app.id);
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
	const isAppEnabled = ['auto_enabled', 'manually_enabled'].includes(app.status);

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
								name: t('Deactivate'),
								modifier: 'alert',
								action: handleDeactivate,
							}
							: {
								icon: 'check',
								name: t('Activate'),
								action: handleActivate,
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

export const createAppButtonPropsHelper = (inactiveClassName, failedClassName) => (app) => {
	const isInstalled = ({ installed }) => installed;
	const isFailed = () => false; // TODO
	const canUpdate = ({ version, marketplaceVersion, isPurchased, price }) =>
		version && marketplaceVersion
		&& semver.lt(version, marketplaceVersion)
		&& (isPurchased || price <= 0);
	const isOnTrialPeriod = ({ subscriptionInfo: { status } = {} }) => status === 'trialing';
	const canDownload = ({ isPurchased, isSubscribed }) => isPurchased || isSubscribed;
	const canTrial = ({ purchaseType, subscriptionInfo }) =>
		purchaseType === 'subscription' && !subscriptionInfo.status;
	const canBuy = ({ price }) => price > 0;

	if (isInstalled(app)) {
		if (isFailed(app)) {
			return {
				className: failedClassName,
				icon: 'warning',
				label: 'Failed',
			};
		}

		if (canUpdate(app)) {
			return {
				className: 'rc-button--primary js-install',
				icon: 'reload',
				label: 'Update',
			};
		}

		if (isOnTrialPeriod(app)) {
			return {
				className: inactiveClassName,
				icon: 'checkmark-circled',
				label: 'Trial period',
			};
		}

		return {
			className: inactiveClassName,
			icon: 'checkmark-circled',
			label: 'Installed',
		};
	}

	if (canDownload(app)) {
		return {
			className: 'rc-button--primary js-install',
			icon: 'circled-arrow-down',
			label: 'Install',
		};
	}

	if (canTrial(app)) {
		return {
			className: 'rc-button--primary js-purchase',
			icon: 'circled-arrow-down',
			label: 'Start a trial',
		};
	}

	if (canBuy(app)) {
		return {
			className: 'rc-button--primary js-purchase',
			icon: 'circled-arrow-down',
			label: 'Buy',
		};
	}

	return {
		className: 'rc-button--primary js-install',
		icon: 'circled-arrow-down',
		label: 'Install',
	};
};

export const triggerButtonLoadingState = (button) => {
	const icon = button.querySelector('.rc-icon use');
	const iconHref = icon.getAttribute('href');

	button.classList.add('loading');
	button.disabled = true;
	icon.setAttribute('href', '#icon-loading');

	return () => {
		button.classList.remove('loading');
		button.disabled = false;
		icon.setAttribute('href', iconHref);
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
