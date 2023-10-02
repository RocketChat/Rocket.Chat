import { Box, Button, ButtonGroup, Grid } from '@rocket.chat/fuselage';
import type { ILicenseV3 } from '@rocket.chat/license';
import { t } from 'i18next';
import React, { memo } from 'react';

import Page from '../../../components/Page';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import { useLicense } from '../../../hooks/useLicense';
import { PlanName, getPlanName } from '../../../lib/utils/getPlanName';
import GetMoreWithEnterprise from './components/GetMoreWithEnterprise';
import AppsUsageCard from './components/cards/AppsUsageCard';
import ConcurrentUsersCard from './components/cards/ConcurrentUsersCard';
import ConcurrentUsersPeakCard from './components/cards/ConcurrentUsersPeakCard';
import CountMACCard from './components/cards/CountMACCard';
import CountSeatsCard from './components/cards/CountSeatsCard';
import FeaturesCard from './components/cards/FeaturesCard';
import MACCard from './components/cards/MACCard';
import MobilePushNotificationCard from './components/cards/MobilePushNotificationCard';
import PlanCard from './components/cards/PlanCard';
import SeatsCard from './components/cards/SeatsCard';

const ManageSubscriptionPage = () => {
	const { data } = useIsEnterprise();
	const { data: licensesData } = useLicense();

	const license = licensesData?.licenses[0] as ILicenseV3;
	const isEnterprise = data?.isEnterprise || false;

	const plan = getPlanName(isEnterprise, license);

	return (
		<Page bg='tint'>
			<Page.Header title={t('Manage_subscription')}>
				<ButtonGroup>
					<Button type='button' primary>
						Upgrade to PRO
					</Button>
				</ButtonGroup>
			</Page.Header>

			<Page.ScrollableContentWithShadow p={16}>
				<Box marginBlock='none' marginInline='auto' width='full' color='default'>
					<Grid m={0}>
						{license && (
							<>
								<Grid.Item lg={4} xs={4} p={8}>
									<PlanCard isEnterprise={isEnterprise} license={license} />
								</Grid.Item>
								<Grid.Item lg={8} xs={4} p={8}>
									<FeaturesCard plan={plan} />
								</Grid.Item>
							</>
						)}

						{plan !== PlanName.COMMUNITY ? (
							<>
								<Grid.Item lg={6} xs={4} p={8}>
									<SeatsCard plan={plan} />
								</Grid.Item>
								<Grid.Item lg={6} xs={4} p={8}>
									<MACCard plan={plan} />
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
									<MobilePushNotificationCard />
								</Grid.Item>
								<Grid.Item lg={4} xs={4} p={8}>
									<ConcurrentUsersCard />
								</Grid.Item>
								<Grid.Item lg={4} xs={4} p={8}>
									<ConcurrentUsersCard />
								</Grid.Item>
								<Grid.Item lg={4} xs={4} p={8}>
									<ConcurrentUsersPeakCard />
								</Grid.Item>
								<Grid.Item lg={4} xs={4} p={8}>
									<AppsUsageCard />
								</Grid.Item>
							</>
						)}
					</Grid>
				</Box>
				{plan !== PlanName.ENTERPRISE && plan !== PlanName.ENTERPRISE_TRIAL && <GetMoreWithEnterprise />}
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default memo(ManageSubscriptionPage);
