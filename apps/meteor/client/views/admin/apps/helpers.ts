import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import type { App, AppPricingPlan, PurchaseType } from '@rocket.chat/core-typings';
import semver from 'semver';

import { Utilities } from '../../../../app/apps/lib/misc/Utilities';
import { t } from '../../../../app/utils/client';
import { dispatchToastMessage } from '../../../lib/toast';

export const appEnabledStatuses = [AppStatus.AUTO_ENABLED, AppStatus.MANUALLY_ENABLED];

// eslint-disable-next-line @typescript-eslint/naming-convention
interface ApiError {
	xhr: {
		responseJSON: {
			error: string;
			status: string;
			messages: string[];
			payload?: any;
		};
	};
}

const appErroredStatuses = [
	AppStatus.COMPILER_ERROR_DISABLED,
	AppStatus.ERROR_DISABLED,
	AppStatus.INVALID_SETTINGS_DISABLED,
	AppStatus.INVALID_LICENSE_DISABLED,
];

type Actions = 'update' | 'install' | 'purchase';

type appButtonResponseProps = {
	action: Actions;
	icon?: 'reload' | 'warning';
	label: 'Update' | 'Install' | 'Subscribe' | 'See Pricing' | 'Try now' | 'Buy';
};

type appStatusSpanResponseProps = {
	type?: 'failed' | 'warning';
	icon: 'warning' | 'ban' | 'checkmark-circled' | 'check';
	label: 'Config Needed' | 'Failed' | 'Disabled' | 'Trial period' | 'Installed' | 'Incompatible';
	tooltipText?: string;
};

type PlanType = 'Subscription' | 'Paid' | 'Free';

type FormattedPriceAndPlan = {
	type: PlanType;
	price: string;
};

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

export function handleInstallError(apiError: ApiError | Error): void {
	if (apiError instanceof Error) {
		dispatchToastMessage({ type: 'error', message: apiError.message });
		return;
	}

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

export const handleAPIError = (error: unknown): void => {
	if (error instanceof Error) {
		const { message } = error;

		if (shouldHandleErrorAsWarning(message)) {
			dispatchToastMessage({ type: 'warning', message });
			return;
		}

		dispatchToastMessage({ type: 'error', message });
	}
};

export const warnAppInstall = (appName: string, status: AppStatus): void => {
	if (appErroredStatuses.includes(status)) {
		dispatchToastMessage({ type: 'error', message: (t(`App_status_${status}`), appName) });
		return;
	}

	dispatchToastMessage({ type: 'success', message: `${appName} installed` });
};

export const warnEnableDisableApp = (appName: string, status: AppStatus, type: string): void => {
	if (appErroredStatuses.includes(status)) {
		dispatchToastMessage({ type: 'error', message: (t(`App_status_${status}`), appName) });
		return;
	}

	if (type === 'enable') {
		dispatchToastMessage({ type: 'success', message: `${appName} enabled` });
		return;
	}

	dispatchToastMessage({ type: 'success', message: `${appName} disabled` });
};

export const warnStatusChange = (appName: string, status: AppStatus): void => {
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
	versionIncompatible,
}: App): appButtonResponseProps | undefined => {
	const canUpdate = installed && version && marketplaceVersion && semver.lt(version, marketplaceVersion);
	if (canUpdate) {
		if (versionIncompatible) {
			return {
				action: 'update',
				icon: 'warning',
				label: 'Update',
			};
		}

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
		if (versionIncompatible) {
			return {
				action: 'install',
				icon: 'warning',
				label: 'Install',
			};
		}

		return {
			action: 'install',
			label: 'Install',
		};
	}

	const canSubscribe = purchaseType === 'subscription' && !subscriptionInfo.status;
	if (canSubscribe) {
		const cannotTry = pricingPlans.every((currentPricingPlan) => currentPricingPlan.trialDays === 0);
		const isTierBased = pricingPlans.every((currentPricingPlan) => currentPricingPlan.tiers && currentPricingPlan.tiers.length > 0);

		if (versionIncompatible) {
			return {
				action: 'purchase',
				label: 'Subscribe',
				icon: 'warning',
			};
		}

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
		if (versionIncompatible) {
			return {
				action: 'purchase',
				label: 'Buy',
				icon: 'warning',
			};
		}

		return {
			action: 'purchase',
			label: 'Buy',
		};
	}

	if (versionIncompatible) {
		return {
			action: 'purchase',
			label: 'Install',
			icon: 'warning',
		};
	}

	return {
		action: 'purchase',
		label: 'Install',
	};
};

export const appIncompatibleStatusProps = (): appStatusSpanResponseProps => ({
	icon: 'check',
	label: 'Incompatible',
	tooltipText: t('App_version_incompatible_tooltip'),
});

export const appStatusSpanProps = ({ installed, status, subscriptionInfo }: App): appStatusSpanResponseProps | undefined => {
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
		label: 'Installed',
	};
};

export const appMultiStatusProps = (app: App, isAppDetailsPage: boolean): appStatusSpanResponseProps[] => {
	const status = appStatusSpanProps(app);
	const statuses = [];

	if (app?.versionIncompatible !== undefined && !isAppDetailsPage) {
		statuses.push(appIncompatibleStatusProps());
	}

	if (status) {
		statuses.push(status);
	}

	return statuses;
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

export const formatPriceAndPurchaseType = (
	purchaseType: PurchaseType,
	pricingPlans: AppPricingPlan[],
	price: number,
): FormattedPriceAndPlan => {
	if (purchaseType === 'subscription') {
		const type = 'Subscription';
		if (!pricingPlans || !Array.isArray(pricingPlans) || pricingPlans.length === 0) {
			return { type, price: '-' };
		}

		return { type, price: formatPricingPlan(pricingPlans[0]) };
	}

	if (price > 0) {
		return { type: 'Paid', price: formatPrice(price) };
	}

	return { type: 'Free', price: '-' };
};
