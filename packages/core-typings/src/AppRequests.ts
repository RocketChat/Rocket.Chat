export type AppRequestFilter = 'unseen' | 'seen' | 'notification-sent' | 'notification-not-sent' | '';

export type AppRequestEndUser = {
	id: string;
	username: string;
	name: string;
	nickname: string;
	emails: string[];
};

export type AppRequest = {
	id: string;
	appId: string;

	requester: AppRequestEndUser;
	admins: AppRequestEndUser[];

	workspaceId: string;
	mesage: string;

	seen: boolean;
	seenAt: string;
	notificationSent: boolean;
	notificationSentAt: string;

	createdAt: string;
};

export type Meta = {
	limit: number;
	offset: number;
	sort: string;
	filter: string;
	total: number;
};

export type PaginatedAppRequests = {
	data: AppRequest[];
	meta: Meta;
};

export type AppRequestsStats = {
	data: {
		totalSeen: number;
		totalUnseen: number;
	};
};
