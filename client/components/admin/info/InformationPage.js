import { Button, Icon } from '@rocket.chat/fuselage';
import React, { useEffect, useState } from 'react';

import { useMethod } from '../../../hooks/useMethod';
import { useViewStatisticsPermission } from '../../../hooks/usePermissions';
import { useRocketChatInformation } from '../../../hooks/useRocketChatInformation';
import { useTranslation } from '../../../hooks/useTranslation';
import { Header } from '../../header/Header';
import { Link } from '../../basic/Link';
import { ErrorAlert } from '../../basic/ErrorAlert';
import { useAdminSideNav } from '../hooks';
import { RocketChatSection } from './RocketChatSection';
import { CommitSection } from './CommitSection';
import { RuntimeEnvironmentSection } from './RuntimeEnvironmentSection';
import { BuildEnvironmentSection } from './BuildEnvironmentSection';
import { UsageSection } from './UsageSection';
import { InstancesSection } from './InstancesSection';

export const useInformationPage = () => {
	useAdminSideNav();

	const canViewStatistics = useViewStatisticsPermission();

	const [isLoading, setLoading] = useState(true);
	const [statistics, setStatistics] = useState({});
	const [instances, setInstances] = useState([]);
	const [fetchStatistics, setFetchStatistics] = useState(() => () => ({}));
	const getStatistics = useMethod('getStatistics');
	const getInstances = useMethod('instances/get');

	useEffect(() => {
		let didCancel = false;

		const fetchStatistics = async () => {
			if (!canViewStatistics) {
				setStatistics(null);
				setInstances(null);
				return;
			}

			setLoading(true);

			try {
				const [statistics, instances] = await Promise.all([
					getStatistics(),
					getInstances(),
				]);

				if (didCancel) {
					return;
				}

				setStatistics(statistics);
				setInstances(instances);
			} finally {
				setLoading(false);
			}
		};

		setFetchStatistics(() => fetchStatistics);

		fetchStatistics();

		return () => {
			didCancel = true;
		};
	}, [canViewStatistics]);

	const info = useRocketChatInformation();

	const handleClickRefreshButton = () => {
		if (isLoading) {
			return;
		}

		fetchStatistics();
	};

	return {
		canViewStatistics,
		isLoading,
		info,
		statistics,
		instances,
		onClickRefreshButton: handleClickRefreshButton,
	};
};

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
						<Icon iconName='reload' /> {t('Refresh')}
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
