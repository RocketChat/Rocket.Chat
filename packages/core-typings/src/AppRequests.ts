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
	message: string;

	seen: boolean;
	seenAt: string;
	notificationSent: boolean;
	notificationSentAt: string;

	createdDate: string;
};

export type Meta = {
	limit: 25 | 50 | 100;
	offset: number;
	sort: string;
	filter: string;
	total: number;
};

export type PaginatedAppRequests = {
	data: AppRequest[] | null;
	meta: Meta;
};

export type AppRequestsStats = {
	data: {
		totalSeen: number;
		totalUnseen: number;
	};
};
