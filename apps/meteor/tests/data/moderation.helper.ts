import { api, credentials, request } from './api-data';

export const reportUser = async (userId: string, reason: string) => {
	const res = await request.post(api('moderation.reportUser')).set(credentials).send({
		userId,
		reason,
	});
	return res.body;
};

export const getUsersReports = async (userId: string) => {
	const res = await request.get(api('moderation.user.reportsByUserId')).set(credentials).query({
		userId,
	});
	return res.body;
};
