import type { IServerInfo, IStats, Serialized } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, Callout, Grid } from '@rocket.chat/fuselage';
import type { IInstance } from '@rocket.chat/rest-typings';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { memo } from 'react';

import SeatsCard from '../../../../ee/client/views/admin/info/SeatsCard';
import { useSeatsCap } from '../../../../ee/client/views/admin/users/useSeatsCap';
import Page from '../../../components/Page';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import DeploymentCard from './DeploymentCard';
import LicenseCard from './LicenseCard';
import UsageCard from './UsageCard';

type InformationPageProps = {
	canViewStatistics: boolean;
	info: IServerInfo;
	statistics: IStats;
	instances: Serialized<IInstance[]>;
	onClickRefreshButton: () => void;
	onClickDownloadInfo: () => void;
};

const InformationPage = memo(function InformationPage({
	canViewStatistics,
	info,
	statistics,
	instances,
	onClickRefreshButton,
	onClickDownloadInfo,
}: InformationPageProps) {
	const t = useTranslation();

	const seatsCap = useSeatsCap();
	const showSeatCap = seatsCap && seatsCap.maxActiveUsers === Infinity;

	const { data } = useIsEnterprise();

	if (!info) {
		return null;
	}

	const warningMultipleInstances = !data?.isEnterprise && !statistics?.msEnabled && statistics?.instanceCount > 1;
	const alertOplogForMultipleInstances = warningMultipleInstances && !statistics.oplogEnabled;

	return (
		<Page data-qa='admin-info' bg='tint'>
			<Page.Header title={t('Workspace')}>
				{canViewStatistics && (
					<ButtonGroup>
						<Button type='button' onClick={onClickDownloadInfo}>
							{t('Download_Info')}
						</Button>
						<Button primary type='button' onClick={onClickRefreshButton}>
							{t('Refresh')}
						</Button>
					</ButtonGroup>
				)}
			</Page.Header>

			<Page.ScrollableContentWithShadow>
				<Box marginBlock='none' marginInline='auto' width='full' color='default'>
					{warningMultipleInstances && (
						<Callout type='warning' title={t('Multiple_monolith_instances_alert')} marginBlockEnd={16}></Callout>
					)}
					{alertOplogForMultipleInstances && (
						<Callout
							type='danger'
							title={t('Error_RocketChat_requires_oplog_tailing_when_running_in_multiple_instances')}
							marginBlockEnd={16}
						>
							<Box withRichContent>
								<p>{t('Error_RocketChat_requires_oplog_tailing_when_running_in_multiple_instances_details')}</p>
								<p>
									<a
										rel='noopener noreferrer'
										target='_blank'
										href={
											'https://rocket.chat/docs/installation/manual-installation/multiple-instances-to-improve-' +
											'performance/#running-multiple-instances-per-host-to-improve-performance'
										}
									>
										{t('Click_here_for_more_info')}
									</a>
								</p>
							</Box>
						</Callout>
					)}

					<Grid>
						<Grid.Item xl={4}>
							<DeploymentCard info={info} statistics={statistics} instances={instances} />
						</Grid.Item>
						<Grid.Item xl={4} p={0}>
							<Grid.Item xl={12} height={!showSeatCap ? '50%' : 'full'}>
								<LicenseCard />
							</Grid.Item>
							{!showSeatCap && (
								<Grid.Item xl={12} height='50%'>
									<SeatsCard seatsCap={seatsCap} />
								</Grid.Item>
							)}
						</Grid.Item>
						<Grid.Item xl={4} md={8} xs={4} sm={8}>
							<UsageCard vertical={false} statistics={statistics} />
						</Grid.Item>
					</Grid>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
});

export default InformationPage;
