import { Button, ButtonGroup, Callout, Icon, Margins } from '@rocket.chat/fuselage';
import React from 'react';

import { Link } from '../../../../../client/components/basic/Link';
import { Page } from '../../../../../client/components/basic/Page';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { RocketChatSection } from './RocketChatSection';
import { CommitSection } from './CommitSection';
import { RuntimeEnvironmentSection } from './RuntimeEnvironmentSection';
import { BuildEnvironmentSection } from './BuildEnvironmentSection';
import { UsageSection } from './UsageSection';
import { InstancesSection } from './InstancesSection';

export function InformationPage({
	canViewStatistics,
	isLoading,
	info,
	statistics,
	instances,
	onClickRefreshButton,
	onClickDownloadInfo,
}) {
	const t = useTranslation();

	if (!info) {
		return null;
	}

	const alertOplogForMultipleInstances = statistics && statistics.instanceCount > 1 && !statistics.oplogEnabled;

	return <Page data-qa='admin-info'>
		<Page.Header title={t('Info')}>
			{canViewStatistics
				&& <ButtonGroup>
					<Button disabled={isLoading} external type='button' onClick={onClickDownloadInfo}>
						<Icon name='download' /> {t('Download_Info')}
					</Button>
					<Button disabled={isLoading} primary type='button' onClick={onClickRefreshButton}>
						<Icon name='reload' /> {t('Refresh')}
					</Button>
				</ButtonGroup>}
		</Page.Header>

		<Page.Content>
			{alertOplogForMultipleInstances
				&& <Margins blockEnd='x16'>
					<Callout type='danger' title={t('Error_RocketChat_requires_oplog_tailing_when_running_in_multiple_instances')}>
						<p>
							{t('Error_RocketChat_requires_oplog_tailing_when_running_in_multiple_instances_details')}
						</p>
						<p>
							<Link external href='https://rocket.chat/docs/installation/manual-installation/multiple-instances-to-improve-performance/#running-multiple-instances-per-host-to-improve-performance'>
								{t('Click_here_for_more_info')}
							</Link>
						</p>
					</Callout>
				</Margins>}

			{canViewStatistics && <RocketChatSection info={info} statistics={statistics} isLoading={isLoading} />}
			<CommitSection info={info} />
			{canViewStatistics && <RuntimeEnvironmentSection statistics={statistics} isLoading={isLoading} />}
			<BuildEnvironmentSection info={info} />
			{canViewStatistics && <UsageSection statistics={statistics} isLoading={isLoading} />}
			<InstancesSection instances={instances} />
		</Page.Content>
	</Page>;
}
