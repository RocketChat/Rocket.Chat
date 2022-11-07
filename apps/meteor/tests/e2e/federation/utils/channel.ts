import faker from '@faker-js/faker';
import type { Page } from '@playwright/test';

import type { FederationChannel } from '../page-objects/channel';
import * as constants from '../config/constants';
import { formatIntoFullMatrixUsername } from './format';
import { doLogin } from './auth';

export const createChannelAndInviteRemoteUserToCreateLocalUser = async ({
	page,
	poFederationChannelServer1,
	userFromServer2UsernameOnly,
}: {
	page: Page;
	poFederationChannelServer1: FederationChannel;
	userFromServer2UsernameOnly: string;
}): Promise<string> => {
	const channelName = faker.datatype.uuid();

	const fullUsernameFromServer2 = await doLoginAndReturnFullUsername(page, userFromServer2UsernameOnly);

	await poFederationChannelServer1.createPublicChannelAndInviteUsersUsingCreationModal(channelName, [fullUsernameFromServer2]);
	page.close();

	return channelName;
};

const doLoginAndReturnFullUsername = async (page: Page, usernameOnly: string) => {
	await doLogin({
		page,
		server: {
			url: constants.RC_SERVER_1.url,
			username: constants.RC_SERVER_1.username,
			password: constants.RC_SERVER_1.password,
		},
	});

	await page.goto(`${constants.RC_SERVER_1.url}/home`);

	return formatIntoFullMatrixUsername(usernameOnly, constants.RC_SERVER_2.matrixServerName);
}

export const createGroupAndInviteRemoteUserToCreateLocalUser = async ({
	page,
	poFederationChannelServer1,
	userFromServer2UsernameOnly,
}: {
	page: Page;
	poFederationChannelServer1: FederationChannel;
	userFromServer2UsernameOnly: string;
}): Promise<string> => {
	const groupName = faker.datatype.uuid();

	const fullUsernameFromServer2 = await doLoginAndReturnFullUsername(page, userFromServer2UsernameOnly);

	await poFederationChannelServer1.createPrivateGroupAndInviteUsersUsingCreationModal(groupName, [fullUsernameFromServer2]);
	page.close();

	return groupName;
};
