import moment from 'moment';
import React, { useEffect, useState } from 'react';
import s from 'underscore.string';

import { call } from '../../../../app/ui-utils/client/lib/callMethod';
import { useViewStatisticsPermission } from '../../../hooks/usePermissions';
import { useTranslation } from '../../../hooks/useTranslation';
import { useReactiveValue } from '../../../hooks/useReactiveValue';
import { Info } from '../../../../app/utils';
import { SideNav } from '../../../../app/ui-utils/client/lib/SideNav';

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
		<header />

		<div className='content'>
			{alertOplogForMultipleInstances && <div className='alert error-color error-border error-background'>
				<b>{t('Error_RocketChat_requires_oplog_tailing_when_running_in_multiple_instances')}</b><br/><br/>
				{t('Error_RocketChat_requires_oplog_tailing_when_running_in_multiple_instances_details')}<br/><br/>
				<a target='_blank' href='https://rocket.chat/docs/installation/manual-installation/multiple-instances-to-improve-performance/#running-multiple-instances-per-host-to-improve-performance'>{t('Click_here_for_more_info')}</a>
			</div>}

			{statistics && <>
				<h3>{t('Rocket.Chat')}</h3>
				<table className='statistics-table secondary-background-color'>
					<tbody>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Version')}</th>
							<td className='border-component-color'>{statistics.version}</td>
						</tr>
						{info.marketplaceApiVersion
						&& <tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Apps_Engine_Version')}</th>
							<td className='border-component-color'>{info.marketplaceApiVersion}</td>
						</tr>}
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('DB_Migration')}</th>
							<td className='border-component-color'>{statistics.migration.version}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('DB_Migration_Date')}</th>
							<td className='border-component-color'>{String(statistics.migration.lockedAt)}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Installed_at')}</th>
							<td className='border-component-color'>{String(statistics.installedAt)}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Uptime')}</th>
							<td className='border-component-color'>{humanReadableTime(statistics.process.uptime)}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Deployment_ID')}</th>
							<td className='border-component-color'>{statistics.uniqueId}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('PID')}</th>
							<td className='border-component-color'>{statistics.process.pid}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Running_Instances')}</th>
							<td className='border-component-color'>{statistics.instanceCount}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('OpLog')}</th>
							<td className='border-component-color'>{statistics.oplogEnabled ? t('Enabled') : t('Disabled')}</td>
						</tr>
					</tbody>
				</table>
			</>}

			<h3>{t('Commit')}</h3>
			<table className='statistics-table secondary-background-color'>
				<tbody>
					<tr className='admin-table-row'>
						<th className='content-background-color border-component-color'>{t('Hash')}</th>
						<td className='border-component-color'>{info.commit.hash}</td>
					</tr>
					<tr className='admin-table-row'>
						<th className='content-background-color border-component-color'>{t('Date')}</th>
						<td className='border-component-color'>{info.commit.date}</td>
					</tr>
					<tr className='admin-table-row'>
						<th className='content-background-color border-component-color'>{t('Branch')}</th>
						<td className='border-component-color'>{info.commit.branch}</td>
					</tr>
					<tr className='admin-table-row'>
						<th className='content-background-color border-component-color'>{t('Tag')}</th>
						<td className='border-component-color'>{info.commit.tag}</td>
					</tr>
					<tr className='admin-table-row'>
						<th className='content-background-color border-component-color'>{t('Author')}</th>
						<td className='border-component-color'>{info.commit.author}</td>
					</tr>
					<tr className='admin-table-row'>
						<th className='content-background-color border-component-color'>{t('Subject')}</th>
						<td className='border-component-color'>{info.commit.subject}</td>
					</tr>
				</tbody>
			</table>

			{statistics ? <>
				<h3>{t('Runtime_Environment')}</h3>
				<table className='statistics-table secondary-background-color'>
					<tbody>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('OS_Type')}</th>
							<td className='border-component-color'>{statistics.os.type}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('OS_Platform')}</th>
							<td className='border-component-color'>{statistics.os.platform}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('OS_Arch')}</th>
							<td className='border-component-color'>{statistics.os.arch}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('OS_Release')}</th>
							<td className='border-component-color'>{statistics.os.release}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Node_version')}</th>
							<td className='border-component-color'>{statistics.process.nodeVersion}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Mongo_version')}</th>
							<td className='border-component-color'>{statistics.mongoVersion}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Mongo_storageEngine')}</th>
							<td className='border-component-color'>{statistics.mongoStorageEngine}</td>
						</tr>

						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('OS_Uptime')}</th>
							<td className='border-component-color'>{humanReadableTime(statistics.os.uptime)}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('OS_Loadavg')}</th>
							<td className='border-component-color'>{numFormat(statistics.os.loadavg[0])}, {numFormat(statistics.os.loadavg[1])}, {numFormat(statistics.os.loadavg[2])}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('OS_Totalmem')}</th>
							<td className='border-component-color'>{inGB(statistics.os.totalmem)}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('OS_Freemem')}</th>
							<td className='border-component-color'>{inGB(statistics.os.freemem)}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('OS_Cpus')}</th>
							<td className='border-component-color'>{statistics.os.cpus.length}</td>
						</tr>
					</tbody>
				</table>

				<h3>{t('Build_Environment')}</h3>
				<table className='statistics-table secondary-background-color'>
					<tbody>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('OS_Platform')}</th>
							<td className='border-component-color'>{build.platform}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('OS_Arch')}</th>
							<td className='border-component-color'>{build.arch}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('OS_Release')}</th>
							<td className='border-component-color'>{build.osRelease}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Node_version')}</th>
							<td className='border-component-color'>{build.nodeVersion}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Date')}</th>
							<td className='border-component-color'>{formatDate(build.date)}</td>
						</tr>
					</tbody>
				</table>

				<h3>{t('Usage')}</h3>
				<table className='statistics-table secondary-background-color'>
					<tbody>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Total_Users')}</th>
							<td className='border-component-color'>{statistics.totalUsers}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Active_Users')}</th>
							<td className='border-component-color'>{statistics.activeUsers}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Non_Active_Users')}</th>
							<td className='border-component-color'>{statistics.nonActiveUsers}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Total_Connected_Users')}</th>
							<td className='border-component-color'>{statistics.totalConnectedUsers}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Online_Users')}</th>
							<td className='border-component-color'>{statistics.onlineUsers}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Away_Users')}</th>
							<td className='border-component-color'>{statistics.awayUsers}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Offline_Users')}</th>
							<td className='border-component-color'>{statistics.offlineUsers}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Total_Rooms')}</th>
							<td className='border-component-color'>{statistics.totalRooms}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Total_Channels')}</th>
							<td className='border-component-color'>{statistics.totalChannels}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Total_Private_Groups')}</th>
							<td className='border-component-color'>{statistics.totalPrivateGroups}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Total_Direct_Messages')}</th>
							<td className='border-component-color'>{statistics.totalDirect}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Total_Livechat_Rooms')}</th>
							<td className='border-component-color'>{statistics.totalLivechat}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Total_Discussions')}</th>
							<td className='border-component-color'>{statistics.totalDiscussions}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Total_Threads')}</th>
							<td className='border-component-color'>{statistics.totalThreads}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Total_Messages')}</th>
							<td className='border-component-color'>{statistics.totalMessages}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Total_Messages_Channel')}</th>
							<td className='border-component-color'>{statistics.totalChannelMessages}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Total_Messages_PrivateGroup')}</th>
							<td className='border-component-color'>{statistics.totalPrivateGroupMessages}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Total_Messages_Direct')}</th>
							<td className='border-component-color'>{statistics.totalDirectMessages}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Total_Messages_Livechat')}</th>
							<td className='border-component-color'>{statistics.totalLivechatMessages}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Total_Uploads')}</th>
							<td className='border-component-color'>{statistics.uploadsTotal}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Total_Uploads_Size')}</th>
							<td className='border-component-color'>{inGB(statistics.uploadsTotalSize)}</td>
						</tr>
						{statistics.apps && <>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Total_Installed_Apps')}</th>
							<td className='border-component-color'>{statistics.apps.totalInstalled}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Total_Active_Apps')}</th>
							<td className='border-component-color'>{statistics.apps.totalActive}</td>
						</tr>
					</>}
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Total_Integrations')}</th>
							<td className='border-component-color'>{statistics.integrations.totalIntegrations}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Total_Incoming_Integrations')}</th>
							<td className='border-component-color'>{statistics.integrations.totalIncoming}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Total_Active_Incoming_Integrations')}</th>
							<td className='border-component-color'>{statistics.integrations.totalIncomingActive}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Total_Outgoing_Integrations')}</th>
							<td className='border-component-color'>{statistics.integrations.totalOutgoing}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Total_Active_Outgoing_Integrations')}</th>
							<td className='border-component-color'>{statistics.integrations.totalOutgoingActive}</td>
						</tr>
						<tr className='admin-table-row'>
							<th className='content-background-color border-component-color'>{t('Stats_Total_Integrations_With_Script_Enabled')}</th>
							<td className='border-component-color'>{statistics.integrations.totalWithScriptEnabled}</td>
						</tr>
					</tbody>
				</table>

				{instances && <>
					<h3>{t('Broadcast_Connected_Instances')}</h3>
					{instances.map(({ address, broadcastAuth, currentStatus, instanceRecord }, i) =>
						<table key={i} className='statistics-table secondary-background-color'>
							<tr className='admin-table-row'>
								<th className='content-background-color border-component-color'>{t('Address')}</th>
								<td className='border-component-color'>{address}</td>
							</tr>
							<tr className='admin-table-row'>
								<th className='content-background-color border-component-color'>{t('Auth')}</th>
								<td className='border-component-color'>{broadcastAuth}</td>
							</tr>
							<tr className='admin-table-row'>
								<th className='content-background-color border-component-color'>{t('Current_Status')} > {t('Connected')}</th>
								<td className='border-component-color'>{currentStatus.connected}</td>
							</tr>
							<tr className='admin-table-row'>
								<th className='content-background-color border-component-color'>{t('Current_Status')} > {t('Retry_Count')}</th>
								<td className='border-component-color'>{currentStatus.retryCount}</td>
							</tr>
							<tr className='admin-table-row'>
								<th className='content-background-color border-component-color'>{t('Current_Status')} > {t('Status')}</th>
								<td className='border-component-color'>{currentStatus.status}</td>
							</tr>
							<tr className='admin-table-row'>
								<th className='content-background-color border-component-color'>{t('Instance_Record')} > {t('ID')}</th>
								<td className='border-component-color'>{instanceRecord._id}</td>
							</tr>
							<tr className='admin-table-row'>
								<th className='content-background-color border-component-color'>{t('Instance_Record')} > {t('PID')}</th>
								<td className='border-component-color'>{instanceRecord.pid}</td>
							</tr>
							<tr className='admin-table-row'>
								<th className='content-background-color border-component-color'>{t('Instance_Record')} > {t('Created_at')}</th>
								<td className='border-component-color'>{formatDate(instanceRecord._createdAt)}</td>
							</tr>
							<tr className='admin-table-row'>
								<th className='content-background-color border-component-color'>{t('Instance_Record')} > {t('Updated_at')}</th>
								<td className='border-component-color'>{formatDate(instanceRecord._updatedAt)}</td>
							</tr>
						</table>
					)}
				</>}

				<button className='button primary refresh' name='refresh' type='button' onClick={handleRefreshClick}>
					{t('Refresh')}
				</button>
			</> : <>{t('Loading...')}</>}
		</div>
	</section>;
}
