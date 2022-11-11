import { test, expect } from '../../utils/test';
import { FederationChannel } from '../../page-objects/channel';
import * as constants from '../../config/constants';
import { doLogin } from '../../utils/auth';

test.describe.parallel('Federation - CE version', () => {
	let poFederationChannelServer2: FederationChannel;

	test.beforeEach(async ({ page }) => {
		poFederationChannelServer2 = new FederationChannel(page);
		await doLogin({
			page,
			server: {
				url: constants.RC_SERVER_2.url,
				username: constants.RC_SERVER_2.username,
				password: constants.RC_SERVER_2.password,
			},
		});
		await page.goto(`${constants.RC_SERVER_2.url}/home`);
	});

	test('expect to not be able to create channels from the UI', async () => {
		await poFederationChannelServer2.sidenav.openNewByLabel('Channel');
		await expect(poFederationChannelServer2.sidenav.checkboxFederatedChannel).toBeDisabled();
	});
});
