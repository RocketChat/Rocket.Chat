import { Box, Button, ButtonGroup, Callout, Grid, Skeleton, Throbber } from '@rocket.chat/fuselage';
import { useRouter } from '@rocket.chat/ui-contexts';
import { t } from 'i18next';
import React, { memo, useEffect } from 'react';

import Page from '../../../components/Page';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import { useLicense } from '../../../hooks/useLicense';
import { useRegistrationStatus } from '../../../hooks/useRegistrationStatus';
import { PlanName, getPlanName } from '../../../lib/utils/getPlanName';
import GetMoreWithEnterprise from './components/GetMoreWithEnterprise';
import UpgradeButton from './components/UpgradeButton';
import ActiveSessionsCard from './components/cards/ActiveSessionsCard';
import AppsUsageCard from './components/cards/AppsUsageCard';
import CountMACCard from './components/cards/CountMACCard';
import CountSeatsCard from './components/cards/CountSeatsCard';
import FeaturesCard from './components/cards/FeaturesCard';
import MACCard from './components/cards/MACCard';
import PlanCard from './components/cards/PlanCard';
import SeatsCard from './components/cards/SeatsCard';
import { useWorkspaceSync } from './hooks/useWorkspaceSync';
import { CONTACT_SALES_LINK } from './utils/links';

const ManageSubscriptionPage = () => {
	const router = useRouter();
	const { data } = useIsEnterprise();
	const { isRegistered, isLoading: isRegisteredLoading } = useRegistrationStatus();
	const { data: licensesData, isLoading: isLicenseLoading, refetch: refetchLicense } = useLicense();
	const syncLicenseUpdate = useWorkspaceSync();

	const { subscriptionSuccess } = router.getSearchParameters();

	const { activeModules = [], license, limits } = licensesData?.data || {};
	const isEnterprise = data?.isEnterprise || false;
	const isTrial = license?.information?.trial ?? false;

	const marketplaceAppsLimit = limits?.marketplaceApps?.max;
	const privateAppsLimit = limits?.privateApps?.max;
	const monthlyActiveContactsLimit = limits?.monthlyActiveContacts?.max;

	const plan = getPlanName(isEnterprise, activeModules, isTrial);

	const getUpgradeButton = () => {
		if (plan === PlanName.COMMUNITY || plan === PlanName.STARTER) {
			return <UpgradeButton primary i18nKey='Upgrade_to_Pro' mis={8} />;
		}

		if (plan === PlanName.PRO || plan === PlanName.PRO_TRIAL) {
			return (
				<Button is='a' type='button' primary external href={CONTACT_SALES_LINK} mis={8}>
					{t('Start_Enterprise_trial')}
				</Button>
			);
		}

		return null;
	};

	const getHeaderButtons = () => {
		return (
			<ButtonGroup>
				{isRegistered && (
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
				)}
				{getUpgradeButton()}
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
			<Page.Header title={t('Manage_subscription')}>{!isRegisteredLoading && getHeaderButtons()}</Page.Header>

			<Page.ScrollableContentWithShadow p={16}>
				{subscriptionSuccess && (
					<Callout type='info' title={t('Sync_license_update_Callout_Title')} m={8}>
						{t('Sync_license_update_Callout')}
					</Callout>
				)}
				{!isLicenseLoading && plan ? (
					<Box marginBlock='none' marginInline='auto' width='full' color='default'>
						<Grid m={0}>
							<Grid.Item lg={4} xs={4} p={8}>
								<PlanCard isEnterprise={isEnterprise} license={license} />
							</Grid.Item>
							<Grid.Item lg={8} xs={4} p={8}>
								<FeaturesCard plan={plan} />
							</Grid.Item>

							{plan === PlanName.COMMUNITY ? (
								<>
									<Grid.Item lg={6} xs={4} p={8}>
										<CountSeatsCard />
									</Grid.Item>
									<Grid.Item lg={6} xs={4} p={8}>
										<CountMACCard />
									</Grid.Item>
									<Grid.Item lg={6} xs={4} p={8}>
										<ActiveSessionsCard />
									</Grid.Item>
									<Grid.Item lg={6} xs={4} p={8}>
										<AppsUsageCard privateAppsLimit={privateAppsLimit} marketplaceAppsLimit={marketplaceAppsLimit} />
									</Grid.Item>
								</>
							) : (
								<>
									<Grid.Item lg={6} xs={4} p={8}>
										<SeatsCard plan={plan} />
									</Grid.Item>
									<Grid.Item lg={6} xs={4} p={8}>
										<MACCard plan={plan} monthlyActiveContactsLimit={monthlyActiveContactsLimit} />
									</Grid.Item>
								</>
							)}
						</Grid>
						{plan !== PlanName.ENTERPRISE && plan !== PlanName.ENTERPRISE_TRIAL && <GetMoreWithEnterprise />}
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
								<Skeleton variant='rect' width='full' height={650} />
							</Grid.Item>
							<Grid.Item lg={6} xs={4} p={8}>
								<Skeleton variant='rect' width='full' height={650} />
							</Grid.Item>
						</Grid>
					</Box>
				)}
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default memo(ManageSubscriptionPage);
