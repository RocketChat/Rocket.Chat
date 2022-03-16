import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
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

export const apiCurlGetter = (absoluteUrl) => (method, api) => {
	const example = api.examples[method] || {};
	return Utilities.curl({
		url: absoluteUrl(api.computedPath),
		method,
		params: example.params,
		query: example.query,
		content: example.content,
		headers: example.headers,
	}).split('\n');
};

export function handleInstallError(apiError) {
	if (!apiError.xhr || !apiError.xhr.responseJSON) {
		return;
	}

	const { status, messages, error, payload = null } = apiError.xhr.responseJSON;

	let message;

	switch (status) {
		case 'storage_error':
			message = messages.join('');
			break;
		case 'app_user_error':
			message = messages.join('');
			if (payload && payload.username) {
				message = t('Apps_User_Already_Exists', { username: payload.username });
			}
			break;
		default:
			if (error) {
				message = error;
			} else {
				message = 'There has been an error installing the app';
			}
	}

	dispatchToastMessage({ type: 'error', message });
}

const shouldHandleErrorAsWarning = (message) => {
	const warnings = ['Could not reach the Marketplace'];

	return warnings.includes(message);
};

export const handleAPIError = (error) => {
	const message = (error.xhr && error.xhr.responseJSON && error.xhr.responseJSON.error) || error.message;

	if (shouldHandleErrorAsWarning(message)) {
		dispatchToastMessage({ type: 'warning', message });
		return;
	}

	dispatchToastMessage({ type: 'error', message });
};

export const warnStatusChange = (appName, status) => {
	if (appErroredStatuses.includes(status)) {
		dispatchToastMessage({ type: 'error', message: (t(`App_status_${status}`), appName) });
		return;
	}

	dispatchToastMessage({ type: 'info', message: (t(`App_status_${status}`), appName) });
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
}) => {
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

export const appStatusSpanProps = ({ installed, status, subscriptionInfo }) => {
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

export const formatPrice = (price) => `\$${Number.parseFloat(price).toFixed(2)}`;

export const formatPricingPlan = ({ strategy, price, tiers = [], trialDays }) => {
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
