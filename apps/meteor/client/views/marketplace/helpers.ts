import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import { App, AppPricingPlan } from '@rocket.chat/core-typings';
import semver from 'semver';

import { Utilities } from '../../../../app/apps/lib/misc/Utilities';
import { t } from '../../../../app/utils/client';
import { dispatchToastMessage } from '../../../lib/toast';

export const appEnabledStatuses = [AppStatus.AUTO_ENABLED, AppStatus.MANUALLY_ENABLED];

const appErroredStatuses = [
	AppStatus.COMPILER_ERROR_DISABLED,
	AppStatus.ERROR_DISABLED,
	AppStatus.INVALID_SETTINGS_DISABLED,
	AppStatus.INVALID_LICENSE_DISABLED,
];

export const apiCurlGetter =
	(absoluteUrl: (path: string) => string) =>
	(method: string, api: IApiEndpointMetadata): string[] => {
		const example = api.examples?.[method];
		return Utilities.curl({
			url: absoluteUrl(api.computedPath),
			method,
			params: example?.params,
			query: example?.query,
			content: example?.content,
			headers: example?.headers,
			auth: '',
		}).split('\n');
	};

export function handleInstallError(apiError: { xhr: { responseJSON: { status: any; messages: any; error: any; payload?: any } } }): void {
	if (!apiError.xhr || !apiError.xhr.responseJSON) {
		return;
	}

	const { status, messages, error, payload = null } = apiError.xhr.responseJSON;

	let message: string;

	switch (status) {
		case 'storage_error':
			message = messages.join('');
			break;
		case 'app_user_error':
			message = messages.join('');
			if (payload?.username) {
				message = t('Apps_User_Already_Exists', { username: payload.username });
			}
			break;
		default:
			if (error) {
				message = error;
			} else {
				message = t('There_has_been_an_error_installing_the_app');
			}
	}

	dispatchToastMessage({ type: 'error', message });
}

const shouldHandleErrorAsWarning = (message: string): boolean => {
	const warnings = ['Could not reach the Marketplace'];

	return warnings.includes(message);
};

export const handleAPIError = (error: {
	xhr: { responseJSON: { status: any; messages: any; error: any; payload?: any } };
	message: string;
}): void => {
	const message = error.xhr?.responseJSON?.error ?? error.message;

	if (shouldHandleErrorAsWarning(message)) {
		dispatchToastMessage({ type: 'warning', message });
		return;
	}

	dispatchToastMessage({ type: 'error', message });
};

export const warnStatusChange = (appName: string, status: AppStatus): void => {
	if (appErroredStatuses.includes(status)) {
		dispatchToastMessage({ type: 'error', message: (t(`App_status_${status}`), appName) });
		return;
	}

	dispatchToastMessage({ type: 'info', message: (t(`App_status_${status}`), appName) });
};

type appButtonPropsResponse = {
	action: 'update' | 'install' | 'purchase';
	icon?: 'reload';
	label: 'Update' | 'Install' | 'Subscribe' | 'See Pricing' | 'Try now' | 'Buy';
};

export const appButtonProps = ({
	installed,
	version,
	marketplaceVersion,
	isPurchased,
	price,
	purchaseType,
	subscriptionInfo,
	pricingPlans,
	isEnterpriseOnly,
}: App): appButtonPropsResponse | undefined => {
	const canUpdate = installed && version && marketplaceVersion && semver.lt(version, marketplaceVersion);
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

	const canSubscribe = purchaseType === 'subscription' && !subscriptionInfo.status;
	if (canSubscribe) {
		const cannotTry = pricingPlans.every((currentPricingPlan) => currentPricingPlan.trialDays === 0);
		const isTierBased = pricingPlans.every((currentPricingPlan) => currentPricingPlan.tiers && currentPricingPlan.tiers.length > 0);

		if (cannotTry || isEnterpriseOnly) {
			return {
				action: 'purchase',
				label: 'Subscribe',
			};
		}

		if (isTierBased) {
			return {
				action: 'purchase',
				label: 'See Pricing',
			};
		}

		return {
			action: 'purchase',
			label: 'Try now',
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

type appStatusSpanPropsResponse = {
	type?: 'failed' | 'warning';
	icon: 'warning' | 'ban' | 'checkmark-circled' | 'check';
	label: 'Config Needed' | 'Failed' | 'Disabled' | 'Trial period' | 'Enabled';
};

export const appStatusSpanProps = ({ installed, status, subscriptionInfo }: App): appStatusSpanPropsResponse | undefined => {
	if (!installed) {
		return;
	}

	const isFailed = status && appErroredStatuses.includes(status);
	if (isFailed) {
		return {
			type: 'failed',
			icon: 'warning',
			label: status === AppStatus.INVALID_SETTINGS_DISABLED ? 'Config Needed' : 'Failed',
		};
	}

	const isEnabled = status && appEnabledStatuses.includes(status);
	if (!isEnabled) {
		return {
			type: 'warning',
			icon: 'ban',
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
		icon: 'check',
		label: 'Enabled',
	};
};

export const formatPrice = (price: number): string => `\$${price.toFixed(2)}`;

export const formatPricingPlan = ({ strategy, price, tiers = [], trialDays }: AppPricingPlan): string => {
	const { perUnit = false } = (Array.isArray(tiers) && tiers.find((tier) => tier.price === price)) || {};

	const pricingPlanTranslationString = [
		'Apps_Marketplace_pricingPlan',
		Array.isArray(tiers) && tiers.length > 0 && '+*',
		strategy,
		trialDays && 'trialDays',
		perUnit && 'perUser',
	]
		.filter(Boolean)
		.join('_');

	return t(pricingPlanTranslationString, {
		price: formatPrice(price),
		trialDays,
	});
};
