import { Button, Icon } from '@rocket.chat/fuselage';
import React from 'react';

import { Link } from '../../basic/Link';
import { ErrorAlert } from '../../basic/ErrorAlert';
import { Header } from '../../header/Header';
import { useTranslation } from '../../providers/TranslationProvider';
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
}) {
	const t = useTranslation();

	if (!info) {
		return null;
	}

	const alertOplogForMultipleInstances = statistics && statistics.instanceCount > 1 && !statistics.oplogEnabled;

	return <section className='page-container page-list Admin__InformationPage'>
		<Header rawSectionName={t('Info')} hideHelp>
			{canViewStatistics
				&& <div className='rc-header__block rc-header__block-action'>
					<Button disabled={isLoading} primary type='button' onClick={onClickRefreshButton}>
						<Icon name='reload' /> {t('Refresh')}
					</Button>
				</div>}
		</Header>

		<div className='content'>
			{alertOplogForMultipleInstances
				&& <ErrorAlert title={t('Error_RocketChat_requires_oplog_tailing_when_running_in_multiple_instances')}>
					<p>
						{t('Error_RocketChat_requires_oplog_tailing_when_running_in_multiple_instances_details')}
					</p>
					<p>
						<Link external href='https://rocket.chat/docs/installation/manual-installation/multiple-instances-to-improve-performance/#running-multiple-instances-per-host-to-improve-performance'>
							{t('Click_here_for_more_info')}
						</Link>
					</p>
				</ErrorAlert>}

			{canViewStatistics && <RocketChatSection info={info} statistics={statistics} isLoading={isLoading} />}
			<CommitSection info={info} />
			{canViewStatistics && <RuntimeEnvironmentSection statistics={statistics} isLoading={isLoading} />}
			<BuildEnvironmentSection info={info} />
			{canViewStatistics && <UsageSection statistics={statistics} isLoading={isLoading} />}
			<InstancesSection instances={instances} />
		</div>
	</section>;
}
