import type { APIRequestContext } from '@playwright/test';

import { API_PREFIX } from '../config/constants';

export const getUserStatusAsViewer = async (viewerApi: APIRequestContext, username: string): Promise<string | undefined> => {
	const response = await viewerApi.get(`${API_PREFIX}/users.info`, { params: { username } });
	const body = await response.json();

	return body.user?.status;
};
