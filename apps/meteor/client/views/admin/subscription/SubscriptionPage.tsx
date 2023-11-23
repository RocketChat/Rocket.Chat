import { Box, Button, ButtonGroup, Callout, Grid, Throbber } from '@rocket.chat/fuselage';
import { useRouter } from '@rocket.chat/ui-contexts';
import { t } from 'i18next';
import React, { memo, useCallback, useEffect } from 'react';

import Page from '../../../components/Page';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import { useInvalidateLicense, useLicense } from '../../../hooks/useLicense';
import { useRegistrationStatus } from '../../../hooks/useRegistrationStatus';
import { SubscriptionCalloutLimits } from './SubscriptionCalloutLimits';
import SubscriptionPageSkeleton from './SubscriptionPageSkeleton';
import UpgradeButton from './components/UpgradeButton';
import UpgradeToGetMore from './components/UpgradeToGetMore';
import ActiveSessionsCard from './components/cards/ActiveSessionsCard';
import ActiveSessionsPeakCard from './components/cards/ActiveSessionsPeakCard';
import AppsUsageCard from './components/cards/AppsUsageCard';
import CountMACCard from './components/cards/CountMACCard';
import CountSeatsCard from './components/cards/CountSeatsCard';
import FeaturesCard from './components/cards/FeaturesCard';
import MACCard from './components/cards/MACCard';
import PlanCard from './components/cards/PlanCard';
import PlanCardCommunity from './components/cards/PlanCard/PlanCardCommunity';
import SeatsCard from './components/cards/SeatsCard';
import { useWorkspaceSync } from './hooks/useWorkspaceSync';

const SubscriptionPage = () => {
	const router = useRouter();
	const { data: enterpriseData } = useIsEnterprise();
	const { isRegistered } = useRegistrationStatus();
	const { data: licensesData, isLoading: isLicenseLoading } = useLicense({ loadValues: true });
	const syncLicenseUpdate = useWorkspaceSync();
	const invalidateLicenseQuery = useInvalidateLicense();

	const { subscriptionSuccess } = router.getSearchParameters();

	const { license, limits, activeModules = [] } = licensesData || {};
	const { isEnterprise = true } = enterpriseData || {};

	const getKeyLimit = (key: 'monthlyActiveContacts' | 'activeUsers') => {
		const { max, value } = limits?.[key] || {};
		return {
			max: max && max !== -1 ? max : Infinity,
			value,
		};
	};

	const macLimit = getKeyLimit('monthlyActiveContacts');
	const seatsLimit = getKeyLimit('activeUsers');

	const handleSyncLicenseUpdate = useCallback(() => {
		syncLicenseUpdate.mutate(undefined, {
			onSuccess: () => invalidateLicenseQuery(),
		});
	}, [invalidateLicenseQuery, syncLicenseUpdate]);

	useEffect(() => {
		if (subscriptionSuccess && syncLicenseUpdate.isIdle) {
			handleSyncLicenseUpdate();
		}
	}, [handleSyncLicenseUpdate, subscriptionSuccess, syncLicenseUpdate]);

	return (
		<Page bg='tint'>
			<Page.Header title={t('Subscription')}>
				<ButtonGroup>
					{isRegistered && (
						<Button
							icon={syncLicenseUpdate.isLoading ? undefined : 'reload'}
							disabled={syncLicenseUpdate.isLoading}
							onClick={() => handleSyncLicenseUpdate()}
						>
							{syncLicenseUpdate.isLoading ? <Throbber size='x12' inheritColor /> : t('Sync_license_update')}
						</Button>
					)}
					<UpgradeButton target='subscription_header' action={isEnterprise ? 'manage_subscription' : 'upgrade'} primary mis={8}>
						{t(isEnterprise ? 'Manage_subscription' : 'Upgrade')}
					</UpgradeButton>
				</ButtonGroup>
			</Page.Header>

			<Page.ScrollableContentWithShadow p={16}>
				{subscriptionSuccess && (
					<Callout type='info' title={t('Sync_license_update_Callout_Title')} m={8}>
						{t('Sync_license_update_Callout')}
					</Callout>
				)}
				<SubscriptionCalloutLimits />
				{isLicenseLoading && <SubscriptionPageSkeleton />}
				{!isLicenseLoading && (
					<Box marginBlock='none' marginInline='auto' width='full' color='default'>
						<Grid m={0}>
							<Grid.Item lg={4} xs={4} p={8}>
								{license && (
									<PlanCard
										licenseInformation={license.information}
										licenseLimits={{ activeUsers: seatsLimit, monthlyActiveContacts: macLimit }}
									/>
								)}
								{!license && <PlanCardCommunity />}
							</Grid.Item>
							<Grid.Item lg={8} xs={4} p={8}>
								<FeaturesCard activeModules={activeModules} isEnterprise={isEnterprise} />
							</Grid.Item>

							{seatsLimit.value !== undefined && (
								<Grid.Item lg={6} xs={4} p={8}>
									{seatsLimit.max !== Infinity ? (
										<SeatsCard value={seatsLimit.value} max={seatsLimit.max} hideManageSubscription={licensesData?.trial} />
									) : (
										<CountSeatsCard activeUsers={seatsLimit?.value} />
									)}
								</Grid.Item>
							)}

							{macLimit.value !== undefined && (
								<Grid.Item lg={6} xs={4} p={8}>
									{macLimit.max !== Infinity ? (
										<MACCard max={macLimit.max} value={macLimit.value} hideManageSubscription={licensesData?.trial} />
									) : (
										<CountMACCard macsCount={macLimit.value} />
									)}
								</Grid.Item>
							)}

							{!license && (
								<>
									{limits?.marketplaceApps !== undefined && (
										<Grid.Item lg={4} xs={4} p={8}>
											<AppsUsageCard privateAppsLimit={limits?.privateApps} marketplaceAppsLimit={limits.marketplaceApps} />
										</Grid.Item>
									)}

									<Grid.Item lg={4} xs={4} p={8}>
										<ActiveSessionsCard />
									</Grid.Item>
									<Grid.Item lg={4} xs={4} p={8}>
										<ActiveSessionsPeakCard />
									</Grid.Item>
								</>
							)}
						</Grid>
						<UpgradeToGetMore activeModules={activeModules} isEnterprise={isEnterprise} />
					</Box>
				)}
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default memo(SubscriptionPage);
