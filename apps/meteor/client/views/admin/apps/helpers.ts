import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import { IApiEndpointMetadata } from '@rocket.chat/apps-engine/definition/api';
import { App } from '@rocket.chat/core-typings';
import semver from 'semver';

import { Utilities } from '../../../../app/apps/lib/misc/Utilities';

export const appEnabledStatuses = [AppStatus.AUTO_ENABLED, AppStatus.MANUALLY_ENABLED];

export const appErroredStatuses = [
	AppStatus.COMPILER_ERROR_DISABLED,
	AppStatus.ERROR_DISABLED,
	AppStatus.INVALID_SETTINGS_DISABLED,
	AppStatus.INVALID_LICENSE_DISABLED,
];

type appButtonResponseProps = {
	action: 'update' | 'install' | 'purchase';
	icon?: 'reload';
	label: 'Update' | 'Install' | 'Subscribe' | 'See Pricing' | 'Try now' | 'Buy';
};

type appStatusSpanResponseProps = {
	type?: 'failed' | 'warning';
	icon: 'warning' | 'ban' | 'checkmark-circled' | 'check';
	label: 'Config Needed' | 'Failed' | 'Disabled' | 'Trial period' | 'Installed';
};

type PlanType = 'Subscription' | 'Paid' | 'Free';

export type FormattedPriceAndPlan = {
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
}: App): appButtonResponseProps | undefined => {
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
