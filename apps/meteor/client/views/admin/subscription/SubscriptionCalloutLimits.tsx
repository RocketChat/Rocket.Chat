import type { LicenseBehavior } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { validateWarnLimit } from '@rocket.chat/license/src/validation/validateLimit';
import { ExternalLink } from '@rocket.chat/ui-client';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useLicense } from '../../../hooks/useLicense';
import { useCheckoutUrl } from './hooks/useCheckoutUrl';

export const SubscriptionCalloutLimits = () => {
	const manageSubscriptionUrl = useCheckoutUrl();

	const { t } = useTranslation();
	const result = useLicense({ loadValues: true });

	if (result.isLoading || result.isError) {
		return null;
	}

	const { license, limits } = result.data;

	if (!license || !limits) {
		return null;
	}

	const keyLimits = Object.keys(limits) as Array<keyof typeof limits>;

	// Get the rule with the highest limit that applies to this key

	const rules = keyLimits
		.map((key) => {
			const rule = license.limits[key]
				?.filter((limit) => validateWarnLimit(limit.max, limits[key].value ?? 0, limit.behavior))
				.sort((a, b) => b.max - a.max)[0];

			if (!rule) {
				return undefined;
			}

			if (rule.max === 0) {
				return undefined;
			}

			if (rule.max === -1) {
				return undefined;
			}

			return [key, rule.behavior];
		})
		.filter(Boolean) as Array<[keyof typeof limits, LicenseBehavior]>;

	if (!rules.length) {
		return null;
	}

	// Group by behavior
	const groupedRules = rules.reduce((acc, [key, behavior]) => {
		if (!acc[behavior]) {
			acc[behavior] = [];
		}

		acc[behavior].push(key);

		return acc;
	}, {} as Record<LicenseBehavior, (keyof typeof limits)[]>);

	const { prevent_action, disable_modules, invalidate_license, start_fair_policy } = groupedRules;

	const map = (key: keyof typeof limits) => t(`subscription.callout.${key}`);

	return (
		<>
			{start_fair_policy && (
				<Callout type='warning' title={t('subscription.callout.servicesDisruptionsMayOccur')} m={8}>
					<Trans i18nKey='subscription.callout.description.limitsReached' count={start_fair_policy.length}>
						Your workspace reached the <>{{ val: start_fair_policy.map(map) }}</> limit.
						<ExternalLink
							to={manageSubscriptionUrl({
								target: 'callout',
								action: 'start_fair_policy',
								limits: start_fair_policy.join(','),
							})}
						>
							Manage your subscription
						</ExternalLink>
						to increase limits.
					</Trans>
				</Callout>
			)}
			{prevent_action && (
				<Callout type='danger' title={t('subscription.callout.servicesDisruptionsOccurring')} m={8}>
					<Trans i18nKey='subscription.callout.description.limitsExceeded' count={prevent_action.length}>
						Your workspace exceeded the <>{{ val: prevent_action.map(map) }}</> license limit.
						<ExternalLink
							to={manageSubscriptionUrl({
								target: 'callout',
								action: 'prevent_action',
								limits: prevent_action.join(','),
							})}
						>
							Manage your subscription
						</ExternalLink>
						to increase limits.
					</Trans>
				</Callout>
			)}

			{disable_modules && (
				<Callout type='danger' title={t('subscription.callout.capabilitiesDisabled')} m={8}>
					<Trans i18nKey='subscription.callout.description.limitsExceeded' count={disable_modules.length}>
						Your workspace exceeded the <>{{ val: disable_modules.map(map) }}</> license limit.
						<ExternalLink
							to={manageSubscriptionUrl({
								target: 'callout',
								action: 'disable_modules',
								limits: disable_modules.join(','),
							})}
						>
							Manage your subscription
						</ExternalLink>
						to increase limits.
					</Trans>
				</Callout>
			)}

			{invalidate_license && (
				<Callout type='danger' title={t('subscription.callout.allPremiumCapabilitiesDisabled')} m={8}>
					<Trans i18nKey='subscription.callout.description.limitsExceeded' count={disable_modules.length}>
						Your workspace exceeded the <>{{ val: invalidate_license.map(map) }}</> license limit.
						<ExternalLink
							to={manageSubscriptionUrl({
								target: 'callout',
								action: 'invalidate_license',
								limits: invalidate_license.join(','),
							})}
						>
							Manage your subscription
						</ExternalLink>
						to increase limits.
					</Trans>
				</Callout>
			)}
		</>
	);
};
