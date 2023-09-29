import { Box, Button, ButtonGroup, Grid } from '@rocket.chat/fuselage';
import { t } from 'i18next';
import React, { memo } from 'react';

import Page from '../../../components/Page';
import GetMoreWithEnterprise from './components/GetMoreWithEnterprise';
import AppsUsageCard from './components/cards/AppsUsageCard';
import ConcurrentUsersCard from './components/cards/ConcurrentUsersCard';
import FeaturesCard from './components/cards/FeaturesCard';
import MACCard from './components/cards/MACCard';
import MaxMACCard from './components/cards/MaxMACCard';
import MaxSeatsCard from './components/cards/MaxSeatsCard';
import MobilePushNotificationCard from './components/cards/MobilePushNotificationCard';
import PlanCard from './components/cards/PlanCard';
import SeatsCard from './components/cards/SeatsCard';

const ManageSubscriptionPage = () => {
	return (
		<Page bg='tint'>
			<Page.Header title={t('Manage_subscription')}>
				<ButtonGroup>
					<Button type='button'>Compare plans</Button>
					<Button type='button' primary>
						Upgrade to PRO
					</Button>
				</ButtonGroup>
			</Page.Header>

			<Page.ScrollableContentWithShadow p={16}>
				<Box marginBlock='none' marginInline='auto' width='full' color='default'>
					<Grid m={0}>
						<Grid.Item lg={4} xs={4} p={8}>
							<PlanCard />
						</Grid.Item>
						<Grid.Item lg={8} xs={4} p={8}>
							<FeaturesCard />
						</Grid.Item>
						<Grid.Item lg={6} xs={4} p={8}>
							<SeatsCard />
						</Grid.Item>
						<Grid.Item lg={6} xs={4} p={8}>
							<MACCard />
						</Grid.Item>
						<Grid.Item lg={4} xs={4} p={8}>
							<MaxSeatsCard />
						</Grid.Item>
						<Grid.Item lg={4} xs={4} p={8}>
							<MaxMACCard />
						</Grid.Item>
						<Grid.Item lg={4} xs={4} p={8}>
							<ConcurrentUsersCard />
						</Grid.Item>
						<Grid.Item lg={4} xs={4} p={8}>
							<MobilePushNotificationCard />
						</Grid.Item>
						<Grid.Item lg={4} xs={4} p={8}>
							<AppsUsageCard />
						</Grid.Item>
					</Grid>
				</Box>
				<GetMoreWithEnterprise />
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default memo(ManageSubscriptionPage);
