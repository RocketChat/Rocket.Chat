import { Box, Button, ButtonGroup, Callout, CardGrid, CardGridItem, Stack } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import {
	Page,
	PageScrollableContentWithShadow,
	PageHeaderNoShadow,
	PageBlockWithBorder,
	useInvalidateLicense,
	useLicenseWithCloudAnnouncement,
	useIsEnterprise,
} from '@rocket.chat/ui-client';
import { useSearchParameter, useRouter } from '@rocket.chat/ui-contexts';
import { t } from 'i18next';
import { memo, useCallback, useEffect } from 'react';

import { SubscriptionCalloutLimits } from './SubscriptionCalloutLimits';
import SubscriptionPageSkeleton from './SubscriptionPageSkeleton';
import LicenseDiagnosticsDebug from './components/LicenseDiagnostics/LicenseDiagnosticsDebug';
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
import SeatsCard from './components/cards/SeatsCard';
import { useCancelSubscriptionModal } from './hooks/useCancelSubscriptionModal';
import { useLicenseDiagnostics } from './hooks/useLicenseDiagnostics';
import { useWorkspaceSync } from './hooks/useWorkspaceSync';
import UiKitSubscriptionLicense from './surface/UiKitSubscriptionLicense';
import { useRegistrationStatus } from '../../../hooks/useRegistrationStatus';

const SubscriptionPage = () => {
	const router = useRouter();
	const { data: enterpriseData } = useIsEnterprise();
	const { canViewRegistrationStatus } = useRegistrationStatus();
	const { data: licensesData, isLoading: isLicenseLoading } = useLicenseWithCloudAnnouncement({ loadValues: true });
	const { data: licenseDiagnostics } = useLicenseDiagnostics();
	const syncLicenseUpdate = useWorkspaceSync();
	const invalidateLicenseQuery = useInvalidateLicense();

	const subscriptionSuccess = useSearchParameter('subscriptionSuccess');

	const showSubscriptionCallout = useDebouncedValue(subscriptionSuccess || syncLicenseUpdate.isPending, 10000);

	const { license, limits, activeModules = [], cloudSyncAnnouncement } = licensesData || {};
	const { isEnterprise = true } = enterpriseData || {};

	const getKeyLimit = (key: 'monthlyActiveContacts' | 'activeUsers') => {
		const { max, value } = limits?.[key] || {};
		return {
			max: max !== undefined && max !== -1 ? max : Infinity,
			value,
		};
	};

	const macLimit = getKeyLimit('monthlyActiveContacts');
	const seatsLimit = getKeyLimit('activeUsers');

	const { isLoading: isCancelSubscriptionLoading, open: openCancelSubscriptionModal } = useCancelSubscriptionModal();

	const handleSyncLicenseUpdate = useCallback(() => {
		syncLicenseUpdate.mutate(undefined, {
			onSuccess: () => invalidateLicenseQuery(100),
		});
	}, [invalidateLicenseQuery, syncLicenseUpdate]);

	useEffect(() => {
		if (subscriptionSuccess && syncLicenseUpdate.isIdle) {
			handleSyncLicenseUpdate();
			return;
		}

		if (subscriptionSuccess) {
			router.navigate(
				{
					name: router.getRouteName()!,
					params: Object.fromEntries(Object.entries(router.getSearchParameters()).filter(([key]) => key !== 'subscriptionSuccess')),
				},
				{
					replace: true,
				},
			);
		}
	}, [handleSyncLicenseUpdate, router, subscriptionSuccess, syncLicenseUpdate.isIdle]);

	return (
		<Page background='tint'>
			<PageHeaderNoShadow title={t('Subscription')}>
				<ButtonGroup>
					{canViewRegistrationStatus && (
						<Button loading={syncLicenseUpdate.isPending} icon='reload' onClick={() => handleSyncLicenseUpdate()}>
							{t('Sync_license_update')}
						</Button>
					)}
					<UpgradeButton target='subscription_header' action={isEnterprise ? 'manage_subscription' : 'upgrade'} variant='primary'>
						{t(isEnterprise ? 'Manage_subscription' : 'Upgrade')}
					</UpgradeButton>
				</ButtonGroup>
			</PageHeaderNoShadow>
			{cloudSyncAnnouncement && (
				<PageBlockWithBorder>
					<UiKitSubscriptionLicense key='license' initialView={cloudSyncAnnouncement} />
				</PageBlockWithBorder>
			)}
			<PageScrollableContentWithShadow padding={16}>
				{(showSubscriptionCallout || syncLicenseUpdate.isPending) && (
					<Box padding={8}>
						<Callout type='info' title={t('Sync_license_update_Callout_Title')}>
							{t('Sync_license_update_Callout')}
						</Callout>
					</Box>
				)}
				<SubscriptionCalloutLimits />
				{isLicenseLoading && <SubscriptionPageSkeleton />}
				{!isLicenseLoading && (
					<>
						<Box marginBlock='none' marginInline='auto' width='full' color='default'>
							<Box padding={8}>
								<Stack gap={16}>
									<LicenseDiagnosticsDebug diagnostics={licenseDiagnostics} activeModules={activeModules} />
									<CardGrid minRowHeight={260}>
										<CardGridItem lg={4} xs={4}>
											<PlanCard license={license} licenseLimits={{ activeUsers: seatsLimit }} />
										</CardGridItem>

										<CardGridItem lg={8} xs={4}>
											<FeaturesCard activeModules={activeModules} isEnterprise={isEnterprise} />
										</CardGridItem>

										{seatsLimit.value !== undefined && (
											<CardGridItem lg={6} xs={4}>
												{seatsLimit.max !== Infinity ? (
													<SeatsCard value={seatsLimit.value} max={seatsLimit.max} hideManageSubscription={licensesData?.trial} />
												) : (
													<CountSeatsCard activeUsers={seatsLimit?.value} />
												)}
											</CardGridItem>
										)}

										{macLimit.value !== undefined && (
											<CardGridItem lg={6} xs={4}>
												{macLimit.max !== Infinity ? (
													<MACCard max={macLimit.max} value={macLimit.value} hideManageSubscription={licensesData?.trial} />
												) : (
													<CountMACCard macsCount={macLimit.value} />
												)}
											</CardGridItem>
										)}

										{!license && limits?.marketplaceApps !== undefined && (
											<CardGridItem lg={4} xs={4}>
												<AppsUsageCard privateAppsLimit={limits?.privateApps} marketplaceAppsLimit={limits.marketplaceApps} />
											</CardGridItem>
										)}

										{!license && (
											<CardGridItem lg={4} xs={4}>
												<ActiveSessionsCard />
											</CardGridItem>
										)}
										{!license && (
											<CardGridItem lg={4} xs={4}>
												<ActiveSessionsPeakCard />
											</CardGridItem>
										)}
									</CardGrid>
								</Stack>
							</Box>
							<UpgradeToGetMore activeModules={activeModules} isEnterprise={isEnterprise}>
								{Boolean(licensesData?.license?.information.cancellable) && (
									<Button loading={isCancelSubscriptionLoading} variant='secondary-danger' onClick={openCancelSubscriptionModal}>
										{t('Cancel_subscription')}
									</Button>
								)}
							</UpgradeToGetMore>
						</Box>
					</>
				)}
			</PageScrollableContentWithShadow>
		</Page>
	);
};

export default memo(SubscriptionPage);
