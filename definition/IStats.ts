import type { CpuInfo } from 'os';

import type { ITeamStats } from './ITeam';

export interface IStats {
	_id: string;
	wizard: Record<string, unknown>;
	uniqueId: string;
	installedAt?: string;
	version?: string;
	tag?: string;
	branch?: string;
	totalUsers: number;
	activeUsers: number;
	activeGuests: number;
	nonActiveUsers: number;
	appUsers: number;
	onlineUsers: number;
	awayUsers: number;
	busyUsers: number;
	totalConnectedUsers: number;
	offlineUsers: number;
	userLanguages: Record<string, number>;
	totalRooms: number;
	totalChannels: number;
	totalPrivateGroups: number;
	totalDirect: number;
	totalLivechat: number;
	totalDiscussions: number;
	totalThreads: number;
	teams: ITeamStats;
	totalLivechatVisitors: number;
	totalLivechatAgents: number;
	livechatEnabled: boolean;
	totalChannelMessages: number;
	totalPrivateGroupMessages: number;
	totalDirectMessages: number;
	totalLivechatMessages: number;
	totalMessages: number;
	federatedServers: number;
	federatedUsers: number;
	lastLogin: string;
	lastMessageSentAt: string;
	lastSeenSubscription: string;
	os: {
		type: string;
		platform: NodeJS.Platform;
		arch: string;
		release: string;
		uptime: number;
		loadavg: number[];
		totalmem: number;
		freemem: number;
		cpus: CpuInfo[];
	};
	process: {
		nodeVersion: string;
		pid: number;
		uptime: number;
	};
	deploy: {
		method: string;
		platform: string;
	};
	enterpriseReady: boolean;
	uploadsTotal: number;
	uploadsTotalSize: number;
	migration: {
		_id: 'control';
		locked: boolean;
		version: number;
		buildAt: string;
		lockedAt: string;
	};
	instanceCount: number;
	oplogEnabled: boolean;
	mongoVersion: string;
	mongoStorageEngine: string;
	pushQueue: number;
}
