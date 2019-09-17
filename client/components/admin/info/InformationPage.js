import moment from 'moment';
import React, { useEffect, useState } from 'react';
import s from 'underscore.string';

import { call } from '../../../../app/ui-utils/client/lib/callMethod';
import { useViewStatisticsPermission } from '../../../hooks/usePermissions';
import { useTranslation } from '../../../hooks/useTranslation';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { Info } from '../../../../app/utils';
import { SideNav } from '../../../../app/ui-utils/client/lib/SideNav';
import { Header } from '../../header/Header';

const useStatistics = () => {
	const [statistics, setStatistics] = useState(null);

	const canViewStatistics = useViewStatisticsPermission();

	const fetchStatistics = async () => {
		if (!canViewStatistics) {
			return;
		}

		setStatistics(null);
		const statistics = await call('getStatistics');
		setStatistics(statistics);
	};

	useEffect(() => {
		fetchStatistics();
	}, [canViewStatistics]);

	return [statistics, fetchStatistics];
};

const useInfo = () => useReactiveValue(() => Info, []);

const useInstances = () => {
	const [instances, setInstances] = useState(null);

	const canViewStatistics = useViewStatisticsPermission();

	const fetchInstances = async () => {
		if (!canViewStatistics) {
			return;
		}

		setInstances(null);
		const instances = await call('instances/get');
		setInstances(instances);
	};

	useEffect(() => {
		fetchInstances();
	}, [canViewStatistics]);

	if (instances && !instances.length) {
		return null;
	}

	return instances;
};

const inGB = (size) => {
	if (size > 1073741824) {
		return `${ s.numberFormat(size / 1024 / 1024 / 1024, 2) } GB`;
	}
	return `${ s.numberFormat(size / 1024 / 1024, 2) } MB`;
};

const formatDate = (date) => {
	if (date) {
		return moment(date).format('LLL');
	}
};

const numFormat = (number) => s.numberFormat(number, 2);

const InformationList = ({ children }) =>
	<table className='statistics-table secondary-background-color'>
		<tbody>
			{children}
		</tbody>
	</table>;

const InformationEntry = ({ children, label }) => <tr className='admin-table-row'>
	<th className='content-background-color border-component-color'>{label}</th>
	<td className='border-component-color'>{children}</td>
</tr>;

export function InformationPage() {
	const [statistics, fetchStatistics] = useStatistics();
	const info = useInfo();
	const build = info && (info.compile || info.build);
	const instances = useInstances();

	const alertOplogForMultipleInstances = statistics && statistics.instanceCount > 1 && !statistics.oplogEnabled;

	const t = useTranslation();

	const humanReadableTime = (time) => {
		const days = Math.floor(time / 86400);
		const hours = Math.floor((time % 86400) / 3600);
		const minutes = Math.floor(((time % 86400) % 3600) / 60);
		const seconds = Math.floor(((time % 86400) % 3600) % 60);
		let out = '';
		if (days > 0) {
			out += `${ days } ${ t('days') }, `;
		}
		if (hours > 0) {
			out += `${ hours } ${ t('hours') }, `;
		}
		if (minutes > 0) {
			out += `${ minutes } ${ t('minutes') }, `;
		}
		if (seconds > 0) {
			out += `${ seconds } ${ t('seconds') }`;
		}
		return out;
	};

	useEffect(() => {
		SideNav.setFlex('adminFlex');
		SideNav.openFlex();
	}, []);

	const handleRefreshClick = () => {
		fetchStatistics();
	};

	return <section className='page-container page-list'>
		<Header rawSectionName={t('Info')} />

		<div className='content'>
			{alertOplogForMultipleInstances && <div className='alert error-color error-border error-background'>
				<b>{t('Error_RocketChat_requires_oplog_tailing_when_running_in_multiple_instances')}</b><br/><br/>
				{t('Error_RocketChat_requires_oplog_tailing_when_running_in_multiple_instances_details')}<br/><br/>
				<a target='_blank' href='https://rocket.chat/docs/installation/manual-installation/multiple-instances-to-improve-performance/#running-multiple-instances-per-host-to-improve-performance'>{t('Click_here_for_more_info')}</a>
			</div>}

			{statistics && <>
				<h3>{t('Rocket.Chat')}</h3>
				<InformationList>
					<InformationEntry label={t('Version')}>{statistics.version}</InformationEntry>
					{info.marketplaceApiVersion
							&& <InformationEntry label={t('Apps_Engine_Version')}>{info.marketplaceApiVersion}</InformationEntry>}
					<InformationEntry label={t('DB_Migration')}>{statistics.migration.version}</InformationEntry>
					<InformationEntry label={t('DB_Migration_Date')}>{formatDate(statistics.migration.lockedAt)}</InformationEntry>
					<InformationEntry label={t('Installed_at')}>{formatDate(statistics.installedAt)}</InformationEntry>
					<InformationEntry label={t('Uptime')}>{humanReadableTime(statistics.process.uptime)}</InformationEntry>
					<InformationEntry label={t('Deployment_ID')}>{statistics.uniqueId}</InformationEntry>
					<InformationEntry label={t('PID')}>{statistics.process.pid}</InformationEntry>
					<InformationEntry label={t('Running_Instances')}>{statistics.instanceCount}</InformationEntry>
					<InformationEntry label={t('OpLog')}>{statistics.oplogEnabled ? t('Enabled') : t('Disabled')}</InformationEntry>
				</InformationList>
			</>}

			<h3>{t('Commit')}</h3>
			<InformationList>
				<InformationEntry label={t('Hash')}>{info.commit.hash}</InformationEntry>
				<InformationEntry label={t('Date')}>{info.commit.date}</InformationEntry>
				<InformationEntry label={t('Branch')}>{info.commit.branch}</InformationEntry>
				<InformationEntry label={t('Tag')}>{info.commit.tag}</InformationEntry>
				<InformationEntry label={t('Author')}>{info.commit.author}</InformationEntry>
				<InformationEntry label={t('Subject')}>{info.commit.subject}</InformationEntry>
			</InformationList>

			{statistics ? <>
				<h3>{t('Runtime_Environment')}</h3>
				<InformationList>
					<InformationEntry label={t('OS_Type')}>{statistics.os.type}</InformationEntry>
					<InformationEntry label={t('OS_Platform')}>{statistics.os.platform}</InformationEntry>
					<InformationEntry label={t('OS_Arch')}>{statistics.os.arch}</InformationEntry>
					<InformationEntry label={t('OS_Release')}>{statistics.os.release}</InformationEntry>
					<InformationEntry label={t('Node_version')}>{statistics.process.nodeVersion}</InformationEntry>
					<InformationEntry label={t('Mongo_version')}>{statistics.mongoVersion}</InformationEntry>
					<InformationEntry label={t('Mongo_storageEngine')}>{statistics.mongoStorageEngine}</InformationEntry>

					<InformationEntry label={t('OS_Uptime')}>{humanReadableTime(statistics.os.uptime)}</InformationEntry>
					<InformationEntry label={t('OS_Loadavg')}>{numFormat(statistics.os.loadavg[0])}, {numFormat(statistics.os.loadavg[1])}, {numFormat(statistics.os.loadavg[2])}</InformationEntry>
					<InformationEntry label={t('OS_Totalmem')}>{inGB(statistics.os.totalmem)}</InformationEntry>
					<InformationEntry label={t('OS_Freemem')}>{inGB(statistics.os.freemem)}</InformationEntry>
					<InformationEntry label={t('OS_Cpus')}>{statistics.os.cpus.length}</InformationEntry>
				</InformationList>

				<h3>{t('Build_Environment')}</h3>
				<InformationList>
					<InformationEntry label={t('OS_Platform')}>{build.platform}</InformationEntry>
					<InformationEntry label={t('OS_Arch')}>{build.arch}</InformationEntry>
					<InformationEntry label={t('OS_Release')}>{build.osRelease}</InformationEntry>
					<InformationEntry label={t('Node_version')}>{build.nodeVersion}</InformationEntry>
					<InformationEntry label={t('Date')}>{formatDate(build.date)}</InformationEntry>
				</InformationList>

				<h3>{t('Usage')}</h3>
				<InformationList>
					<InformationEntry label={t('Stats_Total_Users')}>{statistics.totalUsers}</InformationEntry>
					<InformationEntry label={t('Stats_Active_Users')}>{statistics.activeUsers}</InformationEntry>
					<InformationEntry label={t('Stats_Non_Active_Users')}>{statistics.nonActiveUsers}</InformationEntry>
					<InformationEntry label={t('Stats_Total_Connected_Users')}>{statistics.totalConnectedUsers}</InformationEntry>
					<InformationEntry label={t('Stats_Online_Users')}>{statistics.onlineUsers}</InformationEntry>
					<InformationEntry label={t('Stats_Away_Users')}>{statistics.awayUsers}</InformationEntry>
					<InformationEntry label={t('Stats_Offline_Users')}>{statistics.offlineUsers}</InformationEntry>
					<InformationEntry label={t('Stats_Total_Rooms')}>{statistics.totalRooms}</InformationEntry>
					<InformationEntry label={t('Stats_Total_Channels')}>{statistics.totalChannels}</InformationEntry>
					<InformationEntry label={t('Stats_Total_Private_Groups')}>{statistics.totalPrivateGroups}</InformationEntry>
					<InformationEntry label={t('Stats_Total_Direct_Messages')}>{statistics.totalDirect}</InformationEntry>
					<InformationEntry label={t('Stats_Total_Livechat_Rooms')}>{statistics.totalLivechat}</InformationEntry>
					<InformationEntry label={t('Total_Discussions')}>{statistics.totalDiscussions}</InformationEntry>
					<InformationEntry label={t('Total_Threads')}>{statistics.totalThreads}</InformationEntry>
					<InformationEntry label={t('Stats_Total_Messages')}>{statistics.totalMessages}</InformationEntry>
					<InformationEntry label={t('Stats_Total_Messages_Channel')}>{statistics.totalChannelMessages}</InformationEntry>
					<InformationEntry label={t('Stats_Total_Messages_PrivateGroup')}>{statistics.totalPrivateGroupMessages}</InformationEntry>
					<InformationEntry label={t('Stats_Total_Messages_Direct')}>{statistics.totalDirectMessages}</InformationEntry>
					<InformationEntry label={t('Stats_Total_Messages_Livechat')}>{statistics.totalLivechatMessages}</InformationEntry>
					<InformationEntry label={t('Stats_Total_Uploads')}>{statistics.uploadsTotal}</InformationEntry>
					<InformationEntry label={t('Stats_Total_Uploads_Size')}>{inGB(statistics.uploadsTotalSize)}</InformationEntry>
					{statistics.apps && <>
						<InformationEntry label={t('Stats_Total_Installed_Apps')}>{statistics.apps.totalInstalled}</InformationEntry>
						<InformationEntry label={t('Stats_Total_Active_Apps')}>{statistics.apps.totalActive}</InformationEntry>
					</>}
					<InformationEntry label={t('Stats_Total_Integrations')}>{statistics.integrations.totalIntegrations}</InformationEntry>
					<InformationEntry label={t('Stats_Total_Incoming_Integrations')}>{statistics.integrations.totalIncoming}</InformationEntry>
					<InformationEntry label={t('Stats_Total_Active_Incoming_Integrations')}>{statistics.integrations.totalIncomingActive}</InformationEntry>
					<InformationEntry label={t('Stats_Total_Outgoing_Integrations')}>{statistics.integrations.totalOutgoing}</InformationEntry>
					<InformationEntry label={t('Stats_Total_Active_Outgoing_Integrations')}>{statistics.integrations.totalOutgoingActive}</InformationEntry>
					<InformationEntry label={t('Stats_Total_Integrations_With_Script_Enabled')}>{statistics.integrations.totalWithScriptEnabled}</InformationEntry>
				</InformationList>

				{instances && <>
					<h3>{t('Broadcast_Connected_Instances')}</h3>
					{instances.map(({ address, broadcastAuth, currentStatus, instanceRecord }, i) =>
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
				</>}

				<button className='button primary refresh' name='refresh' type='button' onClick={handleRefreshClick}>
					{t('Refresh')}
				</button>
			</> : <>{t('Loading...')}</>}
		</div>
	</section>;
}
