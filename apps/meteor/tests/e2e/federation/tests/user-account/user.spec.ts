/* eslint-disable */
import { test, expect } from '../../utils/test';
import { FederationChannel } from '../../page-objects/channel';
import * as constants from '../../config/constants';
import { registerUser } from '../../utils/register-user';
import { doLogin } from '../../utils/auth';
import { createChannelAndInviteRemoteUserToCreateLocalUser } from '../../utils/channel';

// TODO: this is skipped until https://github.com/RocketChat/Rocket.Chat/pull/27114 is merged
test.describe.skip('Federation - User Account Pannel', () => {
    let poFederationChannelServer1: FederationChannel;
    let userFromServer2UsernameOnly: string;
    let userFromServer1UsernameOnly: string;
    let createdChannelName: string;

    test.beforeAll(async ({ apiServer1, apiServer2, browser }) => {
        userFromServer1UsernameOnly = await registerUser(apiServer1);
        userFromServer2UsernameOnly = await registerUser(apiServer2);
        const page = await browser.newPage();
        poFederationChannelServer1 = new FederationChannel(page);
        createdChannelName = await createChannelAndInviteRemoteUserToCreateLocalUser({
            page,
            poFederationChannelServer1,
            userFromServer2UsernameOnly,
        });
    });

    test.beforeEach(async ({ page }) => {
        poFederationChannelServer1 = new FederationChannel(page);
        await doLogin({
            page,
            server: {
                url: constants.RC_SERVER_1.url,
                username: constants.RC_SERVER_1.username,
                password: constants.RC_SERVER_1.password,
            },
        });

        await page.addInitScript(() => {
            window.localStorage.setItem('fuselage-localStorage-members-list-type', JSON.stringify('online'));
        });
    });

    test.afterEach(async ({ page }) => {
        await poFederationChannelServer1.sidenav.logout();
        await page.close();
    });

    test('expect to be able to edit a name in Server A and it must be reflected on Server B', async({ }) => {
    });


});
