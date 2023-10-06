import { Box, Button, Grid, Skeleton } from '@rocket.chat/fuselage';
import { t } from 'i18next';
import React, { memo } from 'react';

import Page from '../../../components/Page';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import { useLicense } from '../../../hooks/useLicense';
import { PlanName, getPlanName } from '../../../lib/utils/getPlanName';
import GetMoreWithEnterprise from './components/GetMoreWithEnterprise';
import UpgradeButton from './components/UpgradeButton';
import AppsUsageCard from './components/cards/AppsUsageCard';
import ConcurrentUsersCard from './components/cards/ConcurrentUsersCard';
import CountMACCard from './components/cards/CountMACCard';
import CountSeatsCard from './components/cards/CountSeatsCard';
import FeaturesCard from './components/cards/FeaturesCard';
import MACCard from './components/cards/MACCard';
import MobilePushNotificationCard from './components/cards/MobilePushNotificationCard';
import PlanCard from './components/cards/PlanCard';
import SeatsCard from './components/cards/SeatsCard';
import { CONTACT_SALES_LINK } from './utils/links';

const ManageSubscriptionPage = () => {
	const { data } = useIsEnterprise();
	const { data: licensesData } = useLicense();

	const { activeModules = [], license, limits } = licensesData?.data || {};
	const isEnterprise = data?.isEnterprise || false;
	const isTrial = license?.information?.trial ?? false;

	const marketplaceAppsLimit = limits?.marketplaceApps?.max;
	const privateAppsLimit = limits?.privateApps?.max;
	const monthlyActiveContactsLimit = limits?.monthlyActiveContacts?.max;

	const plan = getPlanName(isEnterprise, activeModules, isTrial);

	const getHeaderButton = () => {
		if (plan === PlanName.COMMUNITY || plan === PlanName.STARTER) {
			return <UpgradeButton primary i18nKey='Upgrade_to_Pro' />;
		}

		if (plan === PlanName.PRO || plan === PlanName.PRO_TRIAL) {
			return (
				<Button is='a' type='button' primary external href={CONTACT_SALES_LINK}>
					{t('Start_Enterprise_trial')}
				</Button>
			);
		}

		return null;
	};

	return (
		<Page bg='tint'>
			<Page.Header title={t('Manage_subscription')}>{getHeaderButton()}</Page.Header>

			<Page.ScrollableContentWithShadow p={16}>
				<Box marginBlock='none' marginInline='auto' width='full' color='default'>
					<Grid m={0}>
						{license ? (
							<>
								<Grid.Item lg={4} xs={4} p={8}>
									<PlanCard isEnterprise={isEnterprise} license={license} />
								</Grid.Item>
								<Grid.Item lg={8} xs={4} p={8}>
									<FeaturesCard plan={plan} />
								</Grid.Item>
							</>
						) : (
							<>
								<Grid.Item lg={4} xs={4} p={8}>
									<Skeleton variant='rect' width='full' height={240} />
								</Grid.Item>
								<Grid.Item lg={8} xs={4} p={8}>
									<Skeleton variant='rect' width='full' height={240} />
								</Grid.Item>
							</>
						)}

						{plan !== PlanName.COMMUNITY ? (
							<>
								<Grid.Item lg={6} xs={4} p={8}>
									<SeatsCard plan={plan} />
								</Grid.Item>
								<Grid.Item lg={6} xs={4} p={8}>
									<MACCard plan={plan} monthlyActiveContactsLimit={monthlyActiveContactsLimit} />
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
									<ConcurrentUsersCard />
								</Grid.Item>
								<Grid.Item lg={6} xs={4} p={8}>
									<AppsUsageCard privateAppsLimit={privateAppsLimit} marketplaceAppsLimit={marketplaceAppsLimit} />
								</Grid.Item>
								<Grid.Item lg={6} xs={4} p={8}>
									<MobilePushNotificationCard />
								</Grid.Item>
							</>
						)}
					</Grid>
					{plan !== PlanName.ENTERPRISE && plan !== PlanName.ENTERPRISE_TRIAL && <GetMoreWithEnterprise />}
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default memo(ManageSubscriptionPage);
