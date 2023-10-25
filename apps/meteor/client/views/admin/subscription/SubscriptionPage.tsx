import { Box, Button, ButtonGroup, Callout, Grid, Skeleton, Throbber } from '@rocket.chat/fuselage';
import { useRouter } from '@rocket.chat/ui-contexts';
import { t } from 'i18next';
import React, { memo, useEffect } from 'react';

import Page from '../../../components/Page';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import { useLicense } from '../../../hooks/useLicense';
import { useRegistrationStatus } from '../../../hooks/useRegistrationStatus';
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
import { useWorkspaceSync } from './hooks/useWorkspaceSync';

const SubscriptionPage = () => {
	const router = useRouter();
	const { data: enterpriseData } = useIsEnterprise();
	const { isRegistered, isLoading: isRegisteredLoading } = useRegistrationStatus();
	const { data: licensesData, isLoading: isLicenseLoading, refetch: refetchLicense } = useLicense({ loadCurrentValues: true });
	const syncLicenseUpdate = useWorkspaceSync();

	const { subscriptionSuccess } = router.getSearchParameters();

	const { license, limits, activeModules = [] } = licensesData || {};
	const { isEnterprise = false } = enterpriseData || {};

	const getHeaderButtons = () => {
		return (
			<ButtonGroup>
				{isRegistered || (isRegistered && subscriptionSuccess) ? (
					<Button
						icon={syncLicenseUpdate.isInitialLoading || syncLicenseUpdate.isRefetching ? undefined : 'reload'}
						onClick={() => handleSyncLicenseUpdateClick()}
					>
						{syncLicenseUpdate.isInitialLoading || syncLicenseUpdate.isRefetching ? (
							<Throbber size='x12' inheritColor />
						) : (
							t('Sync_license_update')
						)}
					</Button>
				) : null}
				<UpgradeButton primary mis={8} i18nKey={isEnterprise ? 'Manage_subscription' : 'Upgrade'} />
			</ButtonGroup>
		);
	};

	const handleSyncLicenseUpdateClick = () => {
		if (syncLicenseUpdate.isInitialLoading || syncLicenseUpdate.isRefetching) {
			return;
		}
		syncLicenseUpdate.refetch();
	};

	useEffect(() => {
		if (subscriptionSuccess && !syncLicenseUpdate.isRefetching) {
			syncLicenseUpdate.refetch();
		}

		if (
			!syncLicenseUpdate.isInitialLoading &&
			!syncLicenseUpdate.isRefetching &&
			!syncLicenseUpdate.isError &&
			syncLicenseUpdate?.data?.success
		) {
			refetchLicense();
		}
	}, [refetchLicense, subscriptionSuccess, syncLicenseUpdate]);

	return (
		<Page bg='tint'>
			<Page.Header title={t('Subscription')}>{!isRegisteredLoading && getHeaderButtons()}</Page.Header>

			<Page.ScrollableContentWithShadow p={16}>
				{subscriptionSuccess && (
					<Callout type='info' title={t('Sync_license_update_Callout_Title')} m={8}>
						{t('Sync_license_update_Callout')}
					</Callout>
				)}
				{!isLicenseLoading ? (
					<Box marginBlock='none' marginInline='auto' width='full' color='default'>
						<Grid m={0}>
							<Grid.Item lg={4} xs={4} p={8}>
								<PlanCard isEnterprise={isEnterprise} licenseInformation={license?.information} />
							</Grid.Item>
							<Grid.Item lg={8} xs={4} p={8}>
								<FeaturesCard activeModules={activeModules} isEnterprise={isEnterprise} />
							</Grid.Item>

							{isEnterprise ? (
								<>
									<Grid.Item lg={6} xs={4} p={8}>
										<SeatsCard />
									</Grid.Item>
									<Grid.Item lg={6} xs={4} p={8}>
										<MACCard monthlyActiveContactsLimit={limits?.monthlyActiveContacts} />
									</Grid.Item>
								</>
							) : (
								<>
									<Grid.Item lg={4} xs={4} p={8}>
										<CountSeatsCard />
									</Grid.Item>
									<Grid.Item lg={4} xs={4} p={8}>
										<CountMACCard />
									</Grid.Item>
									<Grid.Item lg={4} xs={4} p={8}>
										<AppsUsageCard privateAppsLimit={limits?.privateApps} marketplaceAppsLimit={limits?.marketplaceApps} />
									</Grid.Item>
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
				) : (
					<Box marginBlock='none' marginInline='auto' width='full' color='default'>
						<Grid m={0}>
							<Grid.Item lg={4} xs={4} p={8}>
								<Skeleton variant='rect' width='full' height={240} />
							</Grid.Item>
							<Grid.Item lg={8} xs={4} p={8}>
								<Skeleton variant='rect' width='full' height={240} />
							</Grid.Item>
							<Grid.Item lg={6} xs={4} p={8}>
								<Skeleton variant='rect' width='full' height={240} />
							</Grid.Item>
							<Grid.Item lg={6} xs={4} p={8}>
								<Skeleton variant='rect' width='full' height={240} />
							</Grid.Item>
						</Grid>
					</Box>
				)}
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default memo(SubscriptionPage);
