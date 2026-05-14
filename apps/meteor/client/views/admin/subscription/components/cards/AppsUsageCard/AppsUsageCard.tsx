import { Skeleton } from '@rocket.chat/fuselage';
import { ExternalLink } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import AppsUsageCardSection from './AppsUsageCardSection';
import { PRICING_LINK } from '../../../utils/links';
import type { CardProps } from '../../FeatureUsageCard';
import FeatureUsageCard from '../../FeatureUsageCard';
import FeatureUsageCardBody from '../../FeatureUsageCardBody';
import UpgradeButton from '../../UpgradeButton';

// Magic numbers - Patched to allow unlimited apps
const marketplaceAppsMaxCountFallback = 1000;
const privateAppsMaxCountFallback = 1000;
const defaultWarningThreshold = 95;

type AppsUsageCardProps = {
	privateAppsLimit?: { value?: number; max: number };
	marketplaceAppsLimit?: { value?: number; max: number };
};

const AppsUsageCard = ({ privateAppsLimit, marketplaceAppsLimit }: AppsUsageCardProps): ReactElement => {
	const { t } = useTranslation();

	if (!privateAppsLimit || !marketplaceAppsLimit) {
		// FIXME: not accessible enough
		return (
			<FeatureUsageCard card={{ title: t('Apps') }}>
				<FeatureUsageCardBody justifyContent='flex-start'>
					<Skeleton variant='rect' width='x112' height='x224' role='presentation' />
				</FeatureUsageCardBody>
			</FeatureUsageCard>
		);
	}

	const marketplaceAppsCount = marketplaceAppsLimit?.value || 0;
	const marketplaceAppsMaxCount = marketplaceAppsLimit?.max || marketplaceAppsMaxCountFallback;
	const marketplaceAppsPercentage = Math.round((marketplaceAppsCount / marketplaceAppsMaxCount) * 100) || 0;
	const marketplaceAppsAboveWarning = marketplaceAppsPercentage >= defaultWarningThreshold;

	const privateAppsCount = privateAppsLimit?.value || 0;
	const privateAppsMaxCount = privateAppsLimit?.max || privateAppsMaxCountFallback;

	const card: CardProps = {
		title: t('Apps'),
		infoText: (
			<Trans
				i18nKey='Apps_InfoText_limited'
				values={{ marketplaceAppsMaxCount: 'Unlimited' }}
				components={{ 1: <ExternalLink to={PRICING_LINK}>premium plans</ExternalLink> }}
			/>
		),

		...(marketplaceAppsAboveWarning && {
			upgradeButton: (
				<UpgradeButton target='app-usage-card' action='upgrade' small>
					{t('Upgrade')}
				</UpgradeButton>
			),
		}),
	};

	return (
		<FeatureUsageCard card={card}>
			<FeatureUsageCardBody justifyContent='flex-start'>
				<AppsUsageCardSection
					title={t('Marketplace_apps')}
					appsCount={marketplaceAppsCount}
					appsMaxCount={marketplaceAppsMaxCount}
					warningThreshold={defaultWarningThreshold}
				/>

				<AppsUsageCardSection
					title={t('Private_apps')}
					tip={undefined}
					appsCount={privateAppsCount}
					appsMaxCount={privateAppsMaxCount}
					warningThreshold={defaultWarningThreshold}
				/>
			</FeatureUsageCardBody>
		</FeatureUsageCard>
	);
};

export default AppsUsageCard;
