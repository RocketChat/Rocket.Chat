import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import type { FederationChannel } from '../page-objects/channel';
import { doLogin } from './auth';
import type { API } from './test';

const doLoginAndGoToHome = async (
	page: Page,
	server: {
		url: string;
		username: string;
		password: string;
	},
): Promise<void> => {
	await doLogin({
		page,
		server,
	});

	await page.goto(`${server.url}/home`);
};

export const createChannelAndInviteRemoteUserToCreateLocalUser = async ({
	page,
	poFederationChannelServer,
	fullUsernameFromServer,
	server,
	closePageAfterCreation = true,
}: {
	page: Page;
	poFederationChannelServer: FederationChannel;
	fullUsernameFromServer: string;
	server: {
		url: string;
		username: string;
		password: string;
	};
	closePageAfterCreation?: boolean;
}): Promise<string> => {
	const channelName = faker.string.uuid();

	await doLoginAndGoToHome(page, server);

	await poFederationChannelServer.createPublicChannelAndInviteUsersUsingCreationModal(channelName, [fullUsernameFromServer]);
	if (closePageAfterCreation) {
		await page.close();
	}

	return channelName;
};

export const createGroupAndInviteRemoteUserToCreateLocalUser = async ({
	page,
	poFederationChannelServer,
	fullUsernameFromServer,
	server,
}: {
	page: Page;
	poFederationChannelServer: FederationChannel;
	fullUsernameFromServer: string;
	server: {
		url: string;
		username: string;
		password: string;
		matrixServerName: string;
	};
}): Promise<string> => {
	const groupName = faker.string.uuid();

	await doLoginAndGoToHome(page, server);

	await poFederationChannelServer.createPrivateGroupAndInviteUsersUsingCreationModal(groupName, [fullUsernameFromServer]);
	await page.close();

	return groupName;
};

export const createGroupUsingAPI = async (api: API, name: string) => {
	await api.post('/groups.create', { name });
};

export const createChannelUsingAPI = async (api: API, name: string) => {
	await api.post('/channels.create', { name });
};
