import React from 'react';

import { UsageSection } from './UsageSection';

export default {
	title: 'admin/info/UsageSection',
	component: UsageSection,
	decorators: [
		(fn) => <div className='rc-old'>{fn()}</div>,
	],
};

const statistics = {
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

const apps = {
	totalInstalled: 'statistics.apps.totalInstalled',
	totalActive: 'statistics.apps.totalActive',
};

export const _default = () => <UsageSection statistics={statistics} />;

export const withApps = () => <UsageSection statistics={{ ...statistics, apps }} />;

export const loading = () => <UsageSection statistics={{}} isLoading />;
