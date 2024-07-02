import type { LicenseInfo } from '@rocket.chat/core-typings';
import { Callout } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { useLicenseLimitsByBehavior } from '../../../hooks/useLicenseLimitsByBehavior';
import { useCheckoutUrl } from './hooks/useCheckoutUrl';

export const SubscriptionCalloutLimits = () => {
	const manageSubscriptionUrl = useCheckoutUrl();

	const { t } = useTranslation();

	const licenseLimits = useLicenseLimitsByBehavior();

	if (!licenseLimits) {
		return null;
	}

	const { prevent_action, disable_modules, invalidate_license, start_fair_policy } = licenseLimits;

	const toTranslationKey = (key: keyof LicenseInfo['limits']) => t(`subscription.callout.${key}`);

	return (
		<>
			{start_fair_policy && (
				<Callout type='warning' title={t('subscription.callout.servicesDisruptionsMayOccur')} m={8}>
					<Trans i18nKey='subscription.callout.description.limitsReached' count={start_fair_policy.length}>
						Your workspace reached the <>{{ val: start_fair_policy.map(toTranslationKey) }}</> limit.
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
						Your workspace exceeded the <>{{ val: prevent_action.map(toTranslationKey) }}</> license limit.
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
						Your workspace exceeded the <>{{ val: disable_modules.map(toTranslationKey) }}</> license limit.
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
						Your workspace exceeded the <>{{ val: invalidate_license.map(toTranslationKey) }}</> license limit.
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
