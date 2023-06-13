import { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { App } from '@rocket.chat/core-typings';
import semver from 'semver';

// import { t } from '../../../app/utils/client';
import { t } from '../../../app/utils/lib/i18n';
import { appErroredStatuses } from './helpers/appErroredStatuses';

export const appEnabledStatuses = [AppStatus.AUTO_ENABLED, AppStatus.MANUALLY_ENABLED];

export type Actions = 'update' | 'install' | 'purchase' | 'request';

type appButtonResponseProps = {
	action: Actions;
	icon?: 'reload' | 'warning';
	label: 'Update' | 'Install' | 'Subscribe' | 'See Pricing' | 'Try now' | 'Buy' | 'Request' | 'Requested';
};

export type appStatusSpanResponseProps = {
	type?: 'failed' | 'warning';
	icon?: 'warning' | 'checkmark-circled' | 'check';
	label:
		| 'Config Needed'
		| 'Failed'
		| 'Disabled'
		| 'Disabled*'
		| 'Trial period'
		| 'Enabled'
		| 'Enabled*'
		| 'Incompatible'
		| 'request'
		| 'requests'
		| 'Requested';
	tooltipText?: string;
};

type appButtonPropsType = App & { isAdminUser: boolean; endUserRequested: boolean };

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
	isAdminUser,
	// TODO: Unify this two variables
	requestedEndUser,
	endUserRequested,
}: appButtonPropsType): appButtonResponseProps | undefined => {
	if (!isAdminUser) {
		if (requestedEndUser || endUserRequested) {
			return {
				action: 'request',
				label: 'Requested',
			};
		}

		return {
			action: 'request',
			label: 'Request',
		};
	}

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

export const appStatusSpanProps = (
	{ installed, status, subscriptionInfo, appRequestStats, migrated }: App,
	isEnterprise?: boolean,
	context?: string,
	isAppDetailsPage?: boolean,
): appStatusSpanResponseProps | undefined => {
	const isEnabled = status && appEnabledStatuses.includes(status);

	if (installed) {
		if (isEnabled) {
			return migrated && !isEnterprise
				? {
						label: 'Enabled*',
						tooltipText: t('Grandfathered_app'),
				  }
				: {
						label: 'Enabled',
				  };
		}

		return migrated && !isEnterprise
			? {
					label: 'Disabled*',
					tooltipText: t('Grandfathered_app'),
			  }
			: {
					type: 'warning',
					label: 'Disabled',
			  };
	}

	const isFailed = status && appErroredStatuses.includes(status);
	if (isFailed) {
		return {
			type: 'failed',
			icon: 'warning',
			label: status === AppStatus.INVALID_SETTINGS_DISABLED ? 'Config Needed' : 'Failed',
		};
	}

	const isOnTrialPeriod = subscriptionInfo && subscriptionInfo.status === 'trialing';
	if (isOnTrialPeriod) {
		return {
			icon: 'checkmark-circled',
			label: 'Trial period',
		};
	}

	if (context === 'requested' && appRequestStats) {
		if (isAppDetailsPage) {
			return {
				label: 'Requested',
			};
		}

		if (appRequestStats.totalUnseen) {
			return {
				label: appRequestStats.totalUnseen > 1 ? 'requests' : 'request',
			};
		}

		return {
			label: appRequestStats.totalSeen > 1 ? 'requests' : 'request',
		};
	}
};

export const appMultiStatusProps = (
	app: App,
	isAppDetailsPage: boolean,
	context: string,
	isEnterprise: boolean,
): appStatusSpanResponseProps[] => {
	const status = appStatusSpanProps(app, isEnterprise, context, isAppDetailsPage);
	const statuses = [];

	if (app?.versionIncompatible !== undefined && !isAppDetailsPage) {
		statuses.push(appIncompatibleStatusProps());
	}

	if (status) {
		statuses.push(status);
	}

	return statuses;
};
