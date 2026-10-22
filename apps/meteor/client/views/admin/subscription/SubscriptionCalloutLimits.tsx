import type { LicenseInfo } from '@rocket.chat/core-typings';
import { Box, Callout } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import { Trans, useTranslation } from 'react-i18next';

import { useCheckoutUrl } from './hooks/useCheckoutUrl';
import { useLicenseLimitsByBehavior } from '../../../hooks/useLicenseLimitsByBehavior';

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
				<Box margin={8}>
					<Callout type='warning' title={t('subscription.callout.servicesDisruptionsMayOccur')}>
						<Trans
							i18nKey='subscription.callout.description.limitsReached'
							count={start_fair_policy.length}
							value={{ val: start_fair_policy.map(toTranslationKey) }}
						>
							Your workspace reached the <>{start_fair_policy.map(toTranslationKey)}</> limit.
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
				</Box>
			)}

			{prevent_action && (
				<Box margin={8}>
					<Callout type='danger' title={t('subscription.callout.servicesDisruptionsOccurring')}>
						<Trans
							i18nKey='subscription.callout.description.limitsExceeded'
							count={prevent_action.length}
							values={{ val: prevent_action.map(toTranslationKey) }}
						>
							Your workspace exceeded the <>{prevent_action.map(toTranslationKey)}</> license limit.
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
				</Box>
			)}

			{disable_modules && (
				<Box margin={8}>
					<Callout type='danger' title={t('subscription.callout.capabilitiesDisabled')}>
						<Trans
							i18nKey='subscription.callout.description.limitsExceeded'
							count={disable_modules.length}
							values={{ val: disable_modules.map(toTranslationKey) }}
						>
							Your workspace exceeded the <>{disable_modules.map(toTranslationKey)}</> license limit.
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
				</Box>
			)}

			{invalidate_license && (
				<Box margin={8}>
					<Callout type='danger' title={t('subscription.callout.allPremiumCapabilitiesDisabled')}>
						<Trans
							i18nKey='subscription.callout.description.limitsExceeded'
							count={disable_modules.length}
							values={{ val: invalidate_license.map(toTranslationKey) }}
						>
							Your workspace exceeded the <>{invalidate_license.map(toTranslationKey)}</> license limit.
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
				</Box>
			)}
		</>
	);
};
