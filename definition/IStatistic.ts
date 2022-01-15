export interface IStatistic {
	_id: string;

	version: string;
	instanceCount: number;
	oplogEnabled: boolean;
	totalUsers: number;
	activeUsers: number;
	nonActiveUsers: number;
	onlineUsers: number;
	awayUsers: number;
	offlineUsers: number;
	totalRooms: number;
	totalChannels: number;
	totalPrivateGroups: number;
	totalDirect: number;
	totalLivechat: number;
	totalMessages: number;
	totalChannelMessages: number;
	totalPrivateGroupMessages: number;
	totalDirectMessages: number;
	totalLivechatMessages: number;
	pushQueue: number;
}
