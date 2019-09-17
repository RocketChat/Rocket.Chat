import { Button, Icon } from '@rocket.chat/fuselage';
import React, { useCallback, useEffect, useState } from 'react';

import { call } from '../../../../app/ui-utils/client/lib/callMethod';
import { useViewStatisticsPermission } from '../../../hooks/usePermissions';
import { useTranslation } from '../../../hooks/useTranslation';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { Info } from '../../../../app/utils';
import { SideNav } from '../../../../app/ui-utils/client/lib/SideNav';
import { Header } from '../../header/Header';
import { SkeletonText } from './SkeletonText';
import { useFormatters } from '../../../hooks/useFormatters';
import { Link } from '../../basic/Link';
import { ErrorAlert } from '../../basic/ErrorAlert';

const InformationList = ({ children }) =>
	<table className='statistics-table secondary-background-color'>
		<tbody>
			{children}
		</tbody>
	</table>;

const InformationEntry = ({ children, label }) =>
	<tr className='admin-table-row'>
		<th className='content-background-color border-component-color'>{label}</th>
		<td className='border-component-color'>{children}</td>
	</tr>;

function RocketChatSection({ info, statistics, isLoading }) {
	const s = (fn) => (isLoading ? <SkeletonText /> : fn());
	const t = useTranslation();
	const { formatDate, formatHumanReadableTime } = useFormatters();

	const appsEngineVersion = info.marketplaceApiVersion;

	return <>
		<h3>{t('Rocket.Chat')}</h3>
		<InformationList>
			<InformationEntry label={t('Version')}>{s(() => statistics.version)}</InformationEntry>
			{appsEngineVersion && <InformationEntry label={t('Apps_Engine_Version')}>{appsEngineVersion}</InformationEntry>}
			<InformationEntry label={t('DB_Migration')}>{s(() => statistics.migration.version)}</InformationEntry>
			<InformationEntry label={t('DB_Migration_Date')}>{s(() => formatDate(statistics.migration.lockedAt))}</InformationEntry>
			<InformationEntry label={t('Installed_at')}>{s(() => formatDate(statistics.installedAt))}</InformationEntry>
			<InformationEntry label={t('Uptime')}>{s(() => formatHumanReadableTime(statistics.process.uptime))}</InformationEntry>
			<InformationEntry label={t('Deployment_ID')}>{s(() => statistics.uniqueId)}</InformationEntry>
			<InformationEntry label={t('PID')}>{s(() => statistics.process.pid)}</InformationEntry>
			<InformationEntry label={t('Running_Instances')}>{s(() => statistics.instanceCount)}</InformationEntry>
			<InformationEntry label={t('OpLog')}>{s(() => (statistics.oplogEnabled ? t('Enabled') : t('Disabled')))}</InformationEntry>
		</InformationList>
	</>;
}

function CommitSection({ info }) {
	const t = useTranslation();
	const { commit } = info;

	return <>
		<h3>{t('Commit')}</h3>
		<InformationList>
			<InformationEntry label={t('Hash')}>{commit.hash}</InformationEntry>
			<InformationEntry label={t('Date')}>{commit.date}</InformationEntry>
			<InformationEntry label={t('Branch')}>{commit.branch}</InformationEntry>
			<InformationEntry label={t('Tag')}>{commit.tag}</InformationEntry>
			<InformationEntry label={t('Author')}>{commit.author}</InformationEntry>
			<InformationEntry label={t('Subject')}>{commit.subject}</InformationEntry>
		</InformationList>
	</>;
}

function RuntimeEnvironmentSection({ statistics, isLoading }) {
	const s = (fn) => (isLoading ? <SkeletonText /> : fn());
	const t = useTranslation();
	const { formatMemorySize, formatHumanReadableTime, formatCPULoad } = useFormatters();

	return <>
		<h3>{t('Runtime_Environment')}</h3>
		<InformationList>
			<InformationEntry label={t('OS_Type')}>{s(() => statistics.os.type)}</InformationEntry>
			<InformationEntry label={t('OS_Platform')}>{s(() => statistics.os.platform)}</InformationEntry>
			<InformationEntry label={t('OS_Arch')}>{s(() => statistics.os.arch)}</InformationEntry>
			<InformationEntry label={t('OS_Release')}>{s(() => statistics.os.release)}</InformationEntry>
			<InformationEntry label={t('Node_version')}>{s(() => statistics.process.nodeVersion)}</InformationEntry>
			<InformationEntry label={t('Mongo_version')}>{s(() => statistics.mongoVersion)}</InformationEntry>
			<InformationEntry label={t('Mongo_storageEngine')}>{s(() => statistics.mongoStorageEngine)}</InformationEntry>
			<InformationEntry label={t('OS_Uptime')}>{s(() => formatHumanReadableTime(statistics.os.uptime))}</InformationEntry>
			<InformationEntry label={t('OS_Loadavg')}>{s(() => formatCPULoad(statistics.os.loadavg))}</InformationEntry>
			<InformationEntry label={t('OS_Totalmem')}>{s(() => formatMemorySize(statistics.os.totalmem))}</InformationEntry>
			<InformationEntry label={t('OS_Freemem')}>{s(() => formatMemorySize(statistics.os.freemem))}</InformationEntry>
			<InformationEntry label={t('OS_Cpus')}>{s(() => statistics.os.cpus.length)}</InformationEntry>
		</InformationList>
	</>;
}

function BuildEnvironmentSection({ info }) {
	const t = useTranslation();
	const { formatDate } = useFormatters();
	const build = info && (info.compile || info.build);

	return <>
		<h3>{t('Build_Environment')}</h3>
		<InformationList>
			<InformationEntry label={t('OS_Platform')}>{build.platform}</InformationEntry>
			<InformationEntry label={t('OS_Arch')}>{build.arch}</InformationEntry>
			<InformationEntry label={t('OS_Release')}>{build.osRelease}</InformationEntry>
			<InformationEntry label={t('Node_version')}>{build.nodeVersion}</InformationEntry>
			<InformationEntry label={t('Date')}>{formatDate(build.date)}</InformationEntry>
		</InformationList>
	</>;
}

function UsageSection({ statistics, isLoading }) {
	const s = (fn) => (isLoading ? <SkeletonText /> : fn());
	const t = useTranslation();
	const { formatMemorySize } = useFormatters();

	return <>
		<h3>{t('Usage')}</h3>
		<InformationList>
			<InformationEntry label={t('Stats_Total_Users')}>{s(() => statistics.totalUsers)}</InformationEntry>
			<InformationEntry label={t('Stats_Active_Users')}>{s(() => statistics.activeUsers)}</InformationEntry>
			<InformationEntry label={t('Stats_Non_Active_Users')}>{s(() => statistics.nonActiveUsers)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Connected_Users')}>{s(() => statistics.totalConnectedUsers)}</InformationEntry>
			<InformationEntry label={t('Stats_Online_Users')}>{s(() => statistics.onlineUsers)}</InformationEntry>
			<InformationEntry label={t('Stats_Away_Users')}>{s(() => statistics.awayUsers)}</InformationEntry>
			<InformationEntry label={t('Stats_Offline_Users')}>{s(() => statistics.offlineUsers)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Rooms')}>{s(() => statistics.totalRooms)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Channels')}>{s(() => statistics.totalChannels)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Private_Groups')}>{s(() => statistics.totalPrivateGroups)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Direct_Messages')}>{s(() => statistics.totalDirect)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Livechat_Rooms')}>{s(() => statistics.totalLivechat)}</InformationEntry>
			<InformationEntry label={t('Total_Discussions')}>{s(() => statistics.totalDiscussions)}</InformationEntry>
			<InformationEntry label={t('Total_Threads')}>{s(() => statistics.totalThreads)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Messages')}>{s(() => statistics.totalMessages)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Messages_Channel')}>{s(() => statistics.totalChannelMessages)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Messages_PrivateGroup')}>{s(() => statistics.totalPrivateGroupMessages)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Messages_Direct')}>{s(() => statistics.totalDirectMessages)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Messages_Livechat')}>{s(() => statistics.totalLivechatMessages)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Uploads')}>{s(() => statistics.uploadsTotal)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Uploads_Size')}>{s(() => formatMemorySize(statistics.uploadsTotalSize))}</InformationEntry>
			{statistics && statistics.apps && <>
					<InformationEntry label={t('Stats_Total_Installed_Apps')}>{statistics.apps.totalInstalled}</InformationEntry>
					<InformationEntry label={t('Stats_Total_Active_Apps')}>{statistics.apps.totalActive}</InformationEntry>
				</>}
			<InformationEntry label={t('Stats_Total_Integrations')}>{s(() => statistics.integrations.totalIntegrations)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Incoming_Integrations')}>{s(() => statistics.integrations.totalIncoming)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Active_Incoming_Integrations')}>{s(() => statistics.integrations.totalIncomingActive)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Outgoing_Integrations')}>{s(() => statistics.integrations.totalOutgoing)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Active_Outgoing_Integrations')}>{s(() => statistics.integrations.totalOutgoingActive)}</InformationEntry>
			<InformationEntry label={t('Stats_Total_Integrations_With_Script_Enabled')}>{s(() => statistics.integrations.totalWithScriptEnabled)}</InformationEntry>
		</InformationList>
	</>;
}

function InstancesSection({ instances, isLoading }) {
	const t = useTranslation();
	const { formatDate } = useFormatters();

	return <>
		<h3>{t('Broadcast_Connected_Instances')}</h3>
		{isLoading
			? <InformationList>
				<InformationEntry label={t('Address')}><SkeletonText /></InformationEntry>
				<InformationEntry label={t('Auth')}><SkeletonText /></InformationEntry>
				<InformationEntry label={<>{t('Current_Status')} > {t('Connected')}</>}><SkeletonText /></InformationEntry>
				<InformationEntry label={<>{t('Current_Status')} > {t('Retry_Count')}</>}><SkeletonText /></InformationEntry>
				<InformationEntry label={<>{t('Current_Status')} > {t('Status')}</>}><SkeletonText /></InformationEntry>
				<InformationEntry label={<>{t('Instance_Record')} > {t('ID')}</>}><SkeletonText /></InformationEntry>
				<InformationEntry label={<>{t('Instance_Record')} > {t('PID')}</>}><SkeletonText /></InformationEntry>
				<InformationEntry label={<>{t('Instance_Record')} > {t('Created_at')}</>}><SkeletonText />}</InformationEntry>
				<InformationEntry label={<>{t('Instance_Record')} > {t('Updated_at')}</>}><SkeletonText />}</InformationEntry>
			</InformationList>
			: instances.map(({ address, broadcastAuth, currentStatus, instanceRecord }, i) =>
				<InformationList key={i}>
					<InformationEntry label={t('Address')}>{address}</InformationEntry>
					<InformationEntry label={t('Auth')}>{broadcastAuth}</InformationEntry>
					<InformationEntry label={<>{t('Current_Status')} > {t('Connected')}</>}>{currentStatus.connected}</InformationEntry>
					<InformationEntry label={<>{t('Current_Status')} > {t('Retry_Count')}</>}>{currentStatus.retryCount}</InformationEntry>
					<InformationEntry label={<>{t('Current_Status')} > {t('Status')}</>}>{currentStatus.status}</InformationEntry>
					<InformationEntry label={<>{t('Instance_Record')} > {t('ID')}</>}>{instanceRecord._id}</InformationEntry>
					<InformationEntry label={<>{t('Instance_Record')} > {t('PID')}</>}>{instanceRecord.pid}</InformationEntry>
					<InformationEntry label={<>{t('Instance_Record')} > {t('Created_at')}</>}>{formatDate(instanceRecord._createdAt)}</InformationEntry>
					<InformationEntry label={<>{t('Instance_Record')} > {t('Updated_at')}</>}>{formatDate(instanceRecord._updatedAt)}</InformationEntry>
				</InformationList>
			)}
	</>;
}

export function InformationPage() {
	const [isLoading, setLoading] = useState(true);
	const [statistics, setStatistics] = useState(null);
	const [instances, setInstances] = useState(null);
	const info = useReactiveValue(() => Info, []);

	const canViewStatistics = useViewStatisticsPermission();

	const fetchInformation = useCallback(async () => {
		if (!canViewStatistics) {
			return;
		}

		setLoading(true);

		try {
			const [statistics, instances] = await Promise.all([
				call('getStatistics'),
				call('instances/get'),
			]);

			setStatistics(statistics);
			setInstances(instances);
		} finally {
			setLoading(false);
		}
	}, [canViewStatistics]);

	useEffect(() => {
		fetchInformation();
	}, [canViewStatistics]);

	const t = useTranslation();

	useEffect(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	}, []);

	const handleRefreshClick = () => {
		if (isLoading) {
			return;
		}

		fetchInformation();
	};

	const alertOplogForMultipleInstances = statistics && statistics.instanceCount > 1 && !statistics.oplogEnabled;

	return <section className='page-container page-list Admin__InformationPage'>
		<Header rawSectionName={t('Info')} hideHelp>
			<div className='rc-header__block rc-header__block-action'>
				<Button primary type='button' onClick={handleRefreshClick}>
					<Icon name='reload' /> {t('Refresh')}
				</Button>
			</div>
		</Header>

		<div className='content'>
			{alertOplogForMultipleInstances
				&& <ErrorAlert title={t('Error_RocketChat_requires_oplog_tailing_when_running_in_multiple_instances')}>
					<p>{t('Error_RocketChat_requires_oplog_tailing_when_running_in_multiple_instances_details')}</p>
					<Link external href='https://rocket.chat/docs/installation/manual-installation/multiple-instances-to-improve-performance/#running-multiple-instances-per-host-to-improve-performance'>
						{t('Click_here_for_more_info')}
					</Link>
				</ErrorAlert>}

			<RocketChatSection info={info} statistics={statistics} isLoading={isLoading} />
			<CommitSection info={info} />
			<RuntimeEnvironmentSection statistics={statistics} isLoading={isLoading} />
			<BuildEnvironmentSection info={info} />
			<UsageSection statistics={statistics} isLoading={isLoading} />
			<InstancesSection instances={instances} isLoading={isLoading} />
		</div>
	</section>;
}
