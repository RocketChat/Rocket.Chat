import { test, expect } from '@playwright/test'
import { BASE_API_URL } from './utils/mocks/urlMock'
import { adminLogin } from './utils/mocks/userAndPasswordMock';

let headersSession = {
	'X-Auth-Token': '',
	'X-User-Id': ''
}

test.describe('[API Settings Change]', async () => {
	test.beforeAll(async ({ request }) => {
		const response = await request.post(`${BASE_API_URL}/login`, { data: adminLogin })
		const { userId, authToken } = (await response.json()).data

		headersSession['X-Auth-Token'] = authToken
		headersSession['X-User-Id'] = userId
	});
})
