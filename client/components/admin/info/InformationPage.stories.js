import { action } from '@storybook/addon-actions';
import { boolean, object } from '@storybook/addon-knobs/react';
import React from 'react';

import { dummyDate } from '../../../../.storybook/helpers';
import { InformationPage } from './InformationPage';

export default {
	title: 'admin/info/InformationPage',
	component: InformationPage,
};

const info = {
	marketplaceApiVersion: 'info.marketplaceApiVersion',
	commit: {
		hash: 'info.commit.hash',
		date: 'info.commit.date',
		branch: 'info.commit.branch',
		tag: 'info.commit.tag',
		author: 'info.commit.author',
		subject: 'info.commit.subject',
	},
	compile: {
		platform: 'info.compile.platform',
		arch: 'info.compile.arch',
		osRelease: 'info.compile.osRelease',
		nodeVersion: 'info.compile.nodeVersion',
		date: dummyDate,
	},
};

const statistics = {
	version: 'statistics.version',
	migration: {
		version: 'statistics.migration.version',
		lockedAt: dummyDate,
	},
	installedAt: dummyDate,
	process: {
		nodeVersion: 'statistics.process.nodeVersion',
		uptime: 10 * 24 * 60 * 60,
		pid: 'statistics.process.pid',
	},
	uniqueId: 'statistics.uniqueId',
	instanceCount: 1,
	oplogEnabled: true,
	os: {
		type: 'statistics.os.type',
		platform: 'statistics.os.platform',
		arch: 'statistics.os.arch',
		release: 'statistics.os.release',
		uptime: 10 * 24 * 60 * 60,
		loadavg: [1.1, 1.5, 1.15],
		totalmem: 1024,
		freemem: 1024,
		cpus: [{}],
	},
	mongoVersion: 'statistics.mongoVersion',
	mongoStorageEngine: 'statistics.mongoStorageEngine',
	totalUsers: 'statistics.totalUsers',
	nonActiveUsers: 'nonActiveUsers',
	activeUsers: 'statistics.activeUsers',
	totalConnectedUsers: 'statistics.totalConnectedUsers',
	onlineUsers: 'statistics.onlineUsers',
	awayUsers: 'statistics.awayUsers',
	offlineUsers: 'statistics.offlineUsers',
	totalRooms: 'statistics.totalRooms',
	totalChannels: 'statistics.totalChannels',
	totalPrivateGroups: 'statistics.totalPrivateGroups',
	totalDirect: 'statistics.totalDirect',
	totalLivechat: 'statistics.totalLivechat',
	totalDiscussions: 'statistics.totalDiscussions',
	totalThreads: 'statistics.totalThreads',
	totalMessages: 'statistics.totalMessages',
	totalChannelMessages: 'statistics.totalChannelMessages',
	totalPrivateGroupMessages: 'statistics.totalPrivateGroupMessages',
	totalDirectMessages: 'statistics.totalDirectMessages',
	totalLivechatMessages: 'statistics.totalLivechatMessages',
	uploadsTotal: 'statistics.uploadsTotal',
	uploadsTotalSize: 1024,
	integrations: {
		totalIntegrations: 'statistics.integrations.totalIntegrations',
		totalIncoming: 'statistics.integrations.totalIncoming',
		totalIncomingActive: 'statistics.integrations.totalIncomingActive',
		totalOutgoing: 'statistics.integrations.totalOutgoing',
		totalOutgoingActive: 'statistics.integrations.totalOutgoingActive',
		totalWithScriptEnabled: 'statistics.integrations.totalWithScriptEnabled',
	},
};

const instances = [
	{
		address: 'instances[].address',
		broadcastAuth: 'instances[].broadcastAuth',
		currentStatus: {
			connected: 'instances[].currentStatus.connected',
			retryCount: 'instances[].currentStatus.retryCount',
			status: 'instances[].currentStatus.status',
		},
		instanceRecord: {
			_id: 'instances[].instanceRecord._id',
			pid: 'instances[].instanceRecord.pid',
			_createdAt: dummyDate,
			_updatedAt: dummyDate,
		},
	},
];

export const _default = () =>
	<InformationPage
		canViewStatistics={boolean('canViewStatistics', true)}
		isLoading={boolean('isLoading', false)}
		info={object('info', info)}
		statistics={object('statistics', statistics)}
		instances={object('instances', instances)}
		onClickRefreshButton={action('clickRefreshButton')}
	/>;

export const withoutCanViewStatisticsPermission = () =>
	<InformationPage
		info={info}
		onClickRefreshButton={action('clickRefreshButton')}
	/>;

export const loading = () =>
	<InformationPage
		canViewStatistics
		isLoading
		info={info}
		onClickRefreshButton={action('clickRefreshButton')}
	/>;

export const withStatistics = () =>
	<InformationPage
		canViewStatistics
		info={info}
		statistics={statistics}
		onClickRefreshButton={action('clickRefreshButton')}
	/>;

export const withOneInstance = () =>
	<InformationPage
		canViewStatistics
		info={info}
		statistics={statistics}
		instances={instances}
		onClickRefreshButton={action('clickRefreshButton')}
	/>;
