import { getMatrixOpenIdRoutes } from './openid';
import { issueOpenIdToken } from '../../matrixrtc/openid';

const userInfo = (query: string) => getMatrixOpenIdRoutes().getHonoRouter().request(`/v1/openid/userinfo${query}`);

describe('GET /_matrix/federation/v1/openid/userinfo', () => {
	it('answers with the user a token issued here vouches for, without asking for a signature', async () => {
		const { access_token: accessToken } = issueOpenIdToken('@alice:rc1', 'rc1');

		const response = await userInfo(`?access_token=${encodeURIComponent(accessToken)}`);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ sub: '@alice:rc1' });
	});

	it('refuses a token it did not issue', async () => {
		const response = await userInfo('?access_token=forged');

		expect(response.status).toBe(401);
		expect(await response.json()).toMatchObject({ errcode: 'M_UNKNOWN_TOKEN' });
	});

	it('refuses a request without a token', async () => {
		const response = await userInfo('');

		expect(response.status).toBe(401);
		expect(await response.json()).toMatchObject({ errcode: 'M_UNKNOWN_TOKEN' });
	});
});
