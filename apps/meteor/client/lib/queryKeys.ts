import type { ILivechatDepartment, IMessage, IRoom } from '@rocket.chat/core-typings';

export const roomsQueryKeys = {
	all: ['rooms'] as const,
	room: (rid: IRoom['_id']) => ['rooms', rid] as const,
	starredMessages: (rid: IRoom['_id']) => [...roomsQueryKeys.room(rid), 'starred-messages'] as const,
	pinnedMessages: (rid: IRoom['_id']) => [...roomsQueryKeys.room(rid), 'pinned-messages'] as const,
	messages: (rid: IRoom['_id']) => [...roomsQueryKeys.room(rid), 'messages'] as const,
	message: (rid: IRoom['_id'], mid: IMessage['_id']) => [...roomsQueryKeys.messages(rid), mid] as const,
	threads: (rid: IRoom['_id']) => [...roomsQueryKeys.room(rid), 'threads'] as const,
	roles: (rid: IRoom['_id']) => [...roomsQueryKeys.room(rid), 'roles'] as const,
	info: (rid: IRoom['_id']) => [...roomsQueryKeys.room(rid), 'info'] as const,
};

export const subscriptionsQueryKeys = {
	all: ['subscriptions'] as const,
	subscription: (rid: IRoom['_id']) => [...subscriptionsQueryKeys.all, { rid }] as const,
};

export const cannedResponsesQueryKeys = {
	all: ['canned-responses'] as const,
};

export const rolesQueryKeys = {
	all: ['roles'] as const,
	userRoles: () => [...rolesQueryKeys.all, 'user-roles'] as const,
};

export const omnichannelQueryKeys = {
	all: ['omnichannel'] as const,
	department: (id: string) => [...omnichannelQueryKeys.all, 'department', id] as const,
	extensions: (
		params:
			| {
					userId: string;
					type: 'free' | 'allocated' | 'available';
			  }
			| {
					username: string;
					type: 'free' | 'allocated' | 'available';
			  },
	) => [...omnichannelQueryKeys.all, 'extensions', params] as const,
	livechat: {
		appearance: () => [...omnichannelQueryKeys.all, 'livechat', 'appearance'] as const,
		customFields: () => [...omnichannelQueryKeys.all, 'livechat', 'custom-fields'] as const,
	},
	visitorInfo: (uid: string) => [...omnichannelQueryKeys.all, 'visitor-info', uid] as const,
	analytics: {
		all: (departmentId: ILivechatDepartment['_id']) => [...omnichannelQueryKeys.all, 'analytics', departmentId] as const,
		agentsStatus: (departmentId: ILivechatDepartment['_id']) =>
			[...omnichannelQueryKeys.analytics.all(departmentId), 'agents-status'] as const,
		timings: (departmentId: ILivechatDepartment['_id'], dateRange: { start: string; end: string }) =>
			[...omnichannelQueryKeys.analytics.all(departmentId), 'timings', dateRange] as const,
		chats: (departmentId: ILivechatDepartment['_id'], dateRange: { start: string; end: string }) =>
			[...omnichannelQueryKeys.analytics.all(departmentId), 'chats', dateRange] as const,
		chatsPerAgent: (departmentId: ILivechatDepartment['_id'], dateRange: { start: string; end: string }) =>
			[...omnichannelQueryKeys.analytics.all(departmentId), 'chats-per-agent', dateRange] as const,
		chatsPerDepartment: (departmentId: ILivechatDepartment['_id'], dateRange: { start: string; end: string }) =>
			[...omnichannelQueryKeys.analytics.all(departmentId), 'chats-per-department', dateRange] as const,
		agentsProductivityTotals: (departmentId: ILivechatDepartment['_id'], dateRange: { start: string; end: string }) =>
			[...omnichannelQueryKeys.analytics.all(departmentId), 'agents-productivity', dateRange] as const,
		chatsTotals: (departmentId: ILivechatDepartment['_id'], dateRange: { start: string; end: string }) =>
			[...omnichannelQueryKeys.analytics.all(departmentId), 'chats-totals', dateRange] as const,
		conversationTotals: (departmentId: ILivechatDepartment['_id'], dateRange: { start: string; end: string }) =>
			[...omnichannelQueryKeys.analytics.all(departmentId), 'conversation-totals', dateRange] as const,
		productivityTotals: (departmentId: ILivechatDepartment['_id'], dateRange: { start: string; end: string }) =>
			[...omnichannelQueryKeys.analytics.all(departmentId), 'productivity-totals', dateRange] as const,
	},
};

export const deviceManagementQueryKeys = {
	all: ['device-management'] as const,
	userSessions: (params: { sort?: string; count?: number; offset?: number }) =>
		[...deviceManagementQueryKeys.all, 'users-sessions', params] as const,
	sessions: (params: { sort?: string; count?: number; offset?: number }) =>
		[...deviceManagementQueryKeys.all, 'all-users-sessions', params] as const,
	sessionInfo: (sessionId: string) => [...deviceManagementQueryKeys.all, 'session-info', sessionId] as const,
};

export const miscQueryKeys = {
	personalAccessTokens: ['personal-access-tokens'] as const,
	lookup: (endpoint: string) => ['lookup', endpoint] as const,
};

export const voipQueryKeys = {
	all: ['voip'] as const,
	room: (rid: IRoom['_id'], token: string) => [...voipQueryKeys.all, 'room', rid, token] as const,
};
