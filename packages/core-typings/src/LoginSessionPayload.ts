export type LoginSessionPayload = {
	userId: string;
	instanceId: string;
	userAgent: string;
	loginToken?: string;
	connectionId: string;
	clientAddress: string;
	host: string;
};
