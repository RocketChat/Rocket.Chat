import { api, credentials, request } from './api-data';

export const makeModerationApiRequest = async (url: string, method: 'get' | 'post', data?: any) => {
	let res: any;

	if (method === 'get') {
		res = await request.get(api(url)).set(credentials).query(data);
	} else if (method === 'post') {
		res = await request.post(api(url)).set(credentials).send(data);
	}

	return res.body;
};

export const reportUser = (userId: string, reason: string) => makeModerationApiRequest('moderation.reportUser', 'post', { userId, reason });

export const getUsersReports = (userId: string) => makeModerationApiRequest('moderation.user.reportsByUserId', 'get', { userId });
