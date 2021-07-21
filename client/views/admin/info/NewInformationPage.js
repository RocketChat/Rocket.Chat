import { Box, Button, ButtonGroup, Callout, Icon, Margins } from '@rocket.chat/fuselage';
import { useResizeObserver } from '@rocket.chat/fuselage-hooks';
import React, { memo } from 'react';

import { DOUBLE_COLUMN_CARD_WIDTH } from '../../../components/Card';
import Page from '../../../components/Page';
import { useTranslation } from '../../../contexts/TranslationContext';
import DeploymentCard from './DeploymentCard';
import FederationCard from './FederationCard';
import LicenseCard from './LicenseCard';
import UsageCard from './UsageCard';
// import InstancesCard from './InstancesCard';
// import PushCard from './PushCard';

const InformationPage = memo(function InformationPage({
	canViewStatistics,
	isLoading,
	info,
	statistics,
	instances,
	onClickRefreshButton,
	onClickDownloadInfo,
}) {
	const t = useTranslation();

	const { ref, contentBoxSize: { inlineSize = DOUBLE_COLUMN_CARD_WIDTH } = {} } =
		useResizeObserver();

	const isSmall = inlineSize < DOUBLE_COLUMN_CARD_WIDTH;

	if (!info) {
		return null;
	}

	const alertOplogForMultipleInstances =
		statistics && statistics.instanceCount > 1 && !statistics.oplogEnabled;

	return (
		<Page data-qa='admin-info'>
			<Page.Header title={t('Info')}>
				{canViewStatistics && (
					<ButtonGroup>
						<Button disabled={isLoading} external type='button' onClick={onClickDownloadInfo}>
							<Icon name='download' /> {t('Download_Info')}
						</Button>
						<Button disabled={isLoading} primary type='button' onClick={onClickRefreshButton}>
							<Icon name='reload' /> {t('Refresh')}
						</Button>
					</ButtonGroup>
				)}
			</Page.Header>

			<Page.ScrollableContentWithShadow>
				<Box marginBlock='none' marginInline='auto' width='full'>
					{alertOplogForMultipleInstances && (
						<Callout
							type='danger'
							title={t(
								'Error_RocketChat_requires_oplog_tailing_when_running_in_multiple_instances',
							)}
							marginBlockEnd='x16'
						>
							<Box withRichContent>
								<p>
									{t(
										'Error_RocketChat_requires_oplog_tailing_when_running_in_multiple_instances_details',
									)}
								</p>
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

					<Box
						display='flex'
						flexDirection='row'
						w='full'
						flexWrap='wrap'
						justifyContent={isSmall ? 'center' : 'flex-start'}
						ref={ref}
					>
						<Margins all='x8'>
							<DeploymentCard
								info={info}
								statistics={statistics}
								instances={instances}
								isLoading={isLoading}
							/>
							<LicenseCard statistics={statistics} isLoading={isLoading} />
							<UsageCard vertical={isSmall} statistics={statistics} isLoading={isLoading} />
							<FederationCard />
							{/* {!!instances.length && <InstancesCard instances={instances}/>} */}
							{/* <PushCard /> */}
						</Margins>
					</Box>
				</Box>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
});

export default InformationPage;
