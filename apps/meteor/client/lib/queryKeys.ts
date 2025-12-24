import type {
	ILivechatDepartment,
	IMessage,
	IRoom,
	ITeam,
	IUser,
	ILivechatAgent,
	IOutboundProvider,
	RoomType,
} from '@rocket.chat/core-typings';
import type { PaginatedRequest } from '@rocket.chat/rest-typings';

export const roomsQueryKeys = {
	all: ['rooms'] as const,
	room: (rid: IRoom['_id']) => ['rooms', rid] as const,
	roomReference: (reference: string, type: RoomType, uid?: IUser['_id'], username?: IUser['username']) => [
		...roomsQueryKeys.all,
		reference,
		type,
		uid ?? username,
	],
	starredMessages: (rid: IRoom['_id']) => [...roomsQueryKeys.room(rid), 'starred-messages'] as const,
	pinnedMessages: (rid: IRoom['_id']) => [...roomsQueryKeys.room(rid), 'pinned-messages'] as const,
	messages: (rid: IRoom['_id']) => [...roomsQueryKeys.room(rid), 'messages'] as const,
	message: (rid: IRoom['_id'], mid: IMessage['_id']) => [...roomsQueryKeys.messages(rid), mid] as const,
	threads: (rid: IRoom['_id']) => [...roomsQueryKeys.room(rid), 'threads'] as const,
	roles: (rid: IRoom['_id']) => [...roomsQueryKeys.room(rid), 'roles'] as const,
	info: (rid: IRoom['_id']) => [...roomsQueryKeys.room(rid), 'info'] as const,
	members: (rid: IRoom['_id'], roomType: RoomType, type?: 'all' | 'online', filter?: string) =>
		!type && !filter
			? ([...roomsQueryKeys.room(rid), 'members', roomType] as const)
			: ([...roomsQueryKeys.room(rid), 'members', roomType, type, filter] as const),
	files: (rid: IRoom['_id'], options?: { type: string; text: string }) => [...roomsQueryKeys.room(rid), 'files', options] as const,
	images: (rid: IRoom['_id'], options?: { startingFromId?: string }) => [...roomsQueryKeys.room(rid), 'images', options] as const,
	autocomplete: (text: string) => [...roomsQueryKeys.all, 'autocomplete', text] as const,
	discussions: (rid: IRoom['_id'], ...args: [filter: { text?: string }]) => [...roomsQueryKeys.room(rid), 'discussions', ...args] as const,
};

export const subscriptionsQueryKeys = {
	all: ['subscriptions'] as const,
	subscription: (rid: IRoom['_id']) => [...subscriptionsQueryKeys.all, { rid }] as const,
};

export const cannedResponsesQueryKeys = {
	all: ['canned-responses'] as const,
	list: (params: { filter: string; type: string }) => [...cannedResponsesQueryKeys.all, params] as const,
} as const;

export const rolesQueryKeys = {
	all: ['roles'] as const,
	userRoles: () => [...rolesQueryKeys.all, 'user-roles'] as const,
};

export const omnichannelQueryKeys = {
	all: ['omnichannel'] as const,
	department: (id: string) => [...omnichannelQueryKeys.all, 'department', id] as const,
	agents: (query?: PaginatedRequest) =>
		!query ? ([...omnichannelQueryKeys.all, 'agents'] as const) : ([...omnichannelQueryKeys.all, 'agents', query] as const),
	agent: (uid: ILivechatAgent['_id']) => [...omnichannelQueryKeys.agents(), uid] as const,
	agentDepartments: (uid: ILivechatAgent['_id']) => [...omnichannelQueryKeys.agent(uid), 'departments'] as const,
	managers: (query?: PaginatedRequest) =>
		!query ? ([...omnichannelQueryKeys.all, 'managers'] as const) : ([...omnichannelQueryKeys.all, 'managers', query] as const),
	livechat: {
		appearance: () => [...omnichannelQueryKeys.all, 'livechat', 'appearance'] as const,
		customFields: () => [...omnichannelQueryKeys.all, 'livechat', 'custom-fields'] as const,
		customFieldsMetadata: (scope: 'visitor' | 'room') => [...omnichannelQueryKeys.all, 'livechat', 'custom-fields', scope] as const,
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
	contacts: (query?: { filter: string; limit?: number }) =>
		!query ? [...omnichannelQueryKeys.all, 'contacts'] : ([...omnichannelQueryKeys.all, 'contacts', query] as const),
	contact: (contactId?: IRoom['_id']) => [...omnichannelQueryKeys.contacts(), contactId] as const,
	contactMessages: (contactId: IRoom['_id'], filter: { searchTerm: string }) =>
		[...omnichannelQueryKeys.contact(contactId), 'messages', filter] as const,
	outboundProviders: (filter?: { type: IOutboundProvider['providerType'] }) =>
		!filter
			? ([...omnichannelQueryKeys.all, 'outbound-messaging', 'providers'] as const)
			: ([...omnichannelQueryKeys.all, 'outbound-messaging', 'providers', filter] as const),
	outboundProviderMetadata: (providerId: string) => [...omnichannelQueryKeys.outboundProviders(), providerId] as const,
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
	autotranslateSupportedLanguages: (targetLanguage: string) => ['autotranslate', 'supported-languages', targetLanguage] as const,
};

export const usersQueryKeys = {
	all: ['users'] as const,
	userInfo: ({ uid, username }: { uid?: IUser['_id']; username?: IUser['username'] }) =>
		[...usersQueryKeys.all, 'info', { uid, username }] as const,
	userAutoComplete: (filter: string, federated: boolean) => [...usersQueryKeys.all, 'autocomplete', filter, federated] as const,
};

export const teamsQueryKeys = {
	all: ['teams'] as const,
	team: (teamId: ITeam['_id']) => [...teamsQueryKeys.all, teamId] as const,
	teamInfo: (teamId: ITeam['_id']) => [...teamsQueryKeys.team(teamId), 'info'] as const,
	roomsOfUser: (teamId: ITeam['_id'], userId: IUser['_id'], options?: { canUserDelete: boolean }) =>
		[...teamsQueryKeys.team(teamId), 'rooms-of-user', userId, options] as const,
	listUserTeams: (userId: IUser['_id']) => [...teamsQueryKeys.all, 'listUserTeams', userId] as const,
	listChannels: (teamId: ITeam['_id'], options?: { type: 'all' | 'autoJoin'; text: string }) =>
		[...teamsQueryKeys.team(teamId), 'channels', options] as const,
};

export const appsQueryKeys = {
	all: ['apps'] as const,
	slashCommands: () => [...appsQueryKeys.all, 'slashCommands'] as const,
};

export const ABACQueryKeys = {
	all: ['abac'] as const,
	logs: {
		all: () => [...ABACQueryKeys.all, 'logs'] as const,
		list: (...args: [query?: PaginatedRequest]) => [...ABACQueryKeys.logs.all(), 'list', ...args] as const,
	},
	roomAttributes: {
		all: () => [...ABACQueryKeys.all, 'room-attributes'] as const,
		list: (...args: [query?: PaginatedRequest]) => [...ABACQueryKeys.roomAttributes.all(), ...args] as const,
		attribute: (attributeId: string) => [...ABACQueryKeys.roomAttributes.all(), attributeId] as const,
	},
	rooms: {
		all: () => [...ABACQueryKeys.all, 'rooms'] as const,
		list: (...args: [query?: PaginatedRequest]) => [...ABACQueryKeys.rooms.all(), ...args] as const,
		autocomplete: (...args: [query?: PaginatedRequest]) => [...ABACQueryKeys.rooms.all(), 'autocomplete', ...args] as const,
		room: (roomId: string) => [...ABACQueryKeys.rooms.all(), roomId] as const,
	},
};

export const callHistoryQueryKeys = {
	all: ['call-history'] as const,
	info: (callId?: string) => [...callHistoryQueryKeys.all, 'info', callId] as const,
};

export const marketplaceQueryKeys = {
	all: ['marketplace'] as const,
	appsMarketplace: (...args: [canManageApps?: boolean]) => [...marketplaceQueryKeys.all, 'apps-marketplace', ...args] as const,
	appsInstance: (...args: [canManageApps?: boolean]) => [...marketplaceQueryKeys.all, 'apps-instance', ...args] as const,
	appsStored: (...args: unknown[]) => [...marketplaceQueryKeys.all, 'apps-stored', ...args] as const,
	app: (appId: string) => [...marketplaceQueryKeys.all, 'apps', appId] as const,
	appStatus: (appId: string) => [...marketplaceQueryKeys.app(appId), 'status'] as const,
	appLogs: (
		appId: string,
		query: {
			instanceId?: string | undefined;
			endDate?: string | undefined;
			startDate?: string | undefined;
			method?: string | undefined;
			logLevel?: '0' | '1' | '2' | undefined;
			count: number;
			offset: number;
		},
	) => [...marketplaceQueryKeys.app(appId), 'logs', query] as const,
} as const;

export const videoConferenceQueryKeys = {
	all: ['video-conference'] as const,
	fromRoom: (roomId: IRoom['_id']) => [...videoConferenceQueryKeys.all, 'rooms', roomId] as const,
} as const;
