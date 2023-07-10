import { request } from '@playwright/test';

export default async function (): Promise<void> {
	const requestContext = await request.newContext({
		baseURL: process.env.URL,
	});
	const response = await requestContext.post('/api/v1/login', {
		data: {
			username: process.env.USER_ADMIN,
			password: process.env.PASSWORD_ADMIN,
		},
		timeout: 0,
	});
	const dataJson = await response.json();
	const { userId } = dataJson.data;
	const token = dataJson.data.authToken;
	process.env.API_TOKEN = token;
	process.env.USERID = userId;
}
