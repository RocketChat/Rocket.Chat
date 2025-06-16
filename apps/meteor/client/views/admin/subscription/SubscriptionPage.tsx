import { Accordion, AccordionItem, Box, Button, ButtonGroup, Callout, Grid } from '@rocket.chat/fuselage';
import { useDebouncedValue, useSessionStorage } from '@rocket.chat/fuselage-hooks';
import { useSearchParameter, useRouter } from '@rocket.chat/ui-contexts';
import { t } from 'i18next';
import { memo, useCallback, useEffect } from 'react';
import tinykeys from 'tinykeys';

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
import { useCancelSubscriptionModal } from './hooks/useCancelSubscriptionModal';
import { useWorkspaceSync } from './hooks/useWorkspaceSync';
import UiKitSubscriptionLicense from './surface/UiKitSubscriptionLicense';
import { Page, PageScrollableContentWithShadow } from '../../../components/Page';
import PageBlockWithBorder from '../../../components/Page/PageBlockWithBorder';
import PageHeaderNoShadow from '../../../components/Page/PageHeaderNoShadow';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import { useInvalidateLicense, useLicenseWithCloudAnnouncement } from '../../../hooks/useLicense';
import { useRegistrationStatus } from '../../../hooks/useRegistrationStatus';

function useShowLicense() {
	const [showLicenseTab, setShowLicenseTab] = useSessionStorage('admin:showLicenseTab', false);

	useEffect(() => {
		const unsubscribe = tinykeys(window, {
			'ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight b a': () => {
				setShowLicenseTab((showLicenseTab) => !showLicenseTab);
			},
		});
		return () => {
			unsubscribe();
		};
	});

	return showLicenseTab;
}

const SubscriptionPage = () => {
	const showLicense = useShowLicense();
	const router = useRouter();
	const { data: enterpriseData } = useIsEnterprise();
	const { isRegistered } = useRegistrationStatus();
	const { data: licensesData, isLoading: isLicenseLoading } = useLicenseWithCloudAnnouncement({ loadValues: true });
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
		<Page bg='tint'>
			<PageHeaderNoShadow title={t('Subscription')}>
				<ButtonGroup>
					{isRegistered && (
						<Button loading={syncLicenseUpdate.isPending} icon='reload' onClick={() => handleSyncLicenseUpdate()}>
							{t('Sync_license_update')}
						</Button>
					)}
					<UpgradeButton target='subscription_header' action={isEnterprise ? 'manage_subscription' : 'upgrade'} primary>
						{t(isEnterprise ? 'Manage_subscription' : 'Upgrade')}
					</UpgradeButton>
				</ButtonGroup>
			</PageHeaderNoShadow>
			{cloudSyncAnnouncement && (
				<PageBlockWithBorder>
					<UiKitSubscriptionLicense key='license' initialView={cloudSyncAnnouncement} />
				</PageBlockWithBorder>
			)}
			<PageScrollableContentWithShadow p={16}>
				{(showSubscriptionCallout || syncLicenseUpdate.isPending) && (
					<Callout type='info' title={t('Sync_license_update_Callout_Title')} m={8}>
						{t('Sync_license_update_Callout')}
					</Callout>
				)}
				<SubscriptionCalloutLimits />
				{isLicenseLoading && <SubscriptionPageSkeleton />}
				{!isLicenseLoading && (
					<>
						{showLicense && (
							<Accordion>
								<AccordionItem title={t('License')}>
									<pre>{JSON.stringify(licensesData, null, 2)}</pre>
								</AccordionItem>
							</Accordion>
						)}
						<Box marginBlock='none' marginInline='auto' width='full' color='default'>
							<Grid m={0}>
								<Grid.Item lg={4} xs={4} p={8} minHeight={260}>
									{license && <PlanCard licenseInformation={license.information} licenseLimits={{ activeUsers: seatsLimit }} />}
									{!license && <PlanCardCommunity />}
								</Grid.Item>

								<Grid.Item lg={8} xs={4} p={8} minHeight={260}>
									<FeaturesCard activeModules={activeModules} isEnterprise={isEnterprise} />
								</Grid.Item>

								{seatsLimit.value !== undefined && (
									<Grid.Item lg={6} xs={4} p={8} minHeight={260}>
										{seatsLimit.max !== Infinity ? (
											<SeatsCard value={seatsLimit.value} max={seatsLimit.max} hideManageSubscription={licensesData?.trial} />
										) : (
											<CountSeatsCard activeUsers={seatsLimit?.value} />
										)}
									</Grid.Item>
								)}

								{macLimit.value !== undefined && (
									<Grid.Item lg={6} xs={4} p={8} minHeight={260}>
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
											<Grid.Item lg={4} xs={4} p={8} minHeight={260}>
												<AppsUsageCard privateAppsLimit={limits?.privateApps} marketplaceAppsLimit={limits.marketplaceApps} />
											</Grid.Item>
										)}

										<Grid.Item lg={4} xs={4} p={8} minHeight={260}>
											<ActiveSessionsCard />
										</Grid.Item>
										<Grid.Item lg={4} xs={4} p={8} minHeight={260}>
											<ActiveSessionsPeakCard />
										</Grid.Item>
									</>
								)}
							</Grid>
							<UpgradeToGetMore activeModules={activeModules} isEnterprise={isEnterprise}>
								{Boolean(licensesData?.license?.information.cancellable) && (
									<Button loading={isCancelSubscriptionLoading} secondary danger onClick={openCancelSubscriptionModal}>
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
