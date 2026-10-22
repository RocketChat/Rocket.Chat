import type { APIRequestContext } from '@playwright/test';
import { request } from '@playwright/test';

import { BASE_URL, DEFAULT_USER_CREDENTIALS, IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { deletePrivateRoomsByName, setSettingValueById } from './utils';
import {
	addUserAbacAttributes,
	createAbacAttribute,
	deleteAbacAttribute,
	getGroupInfo,
	getGroupMemberUsernames,
	removeUserAbacAttributes,
} from './utils/abac';
import { preserveSettings } from './utils/preserveSettings';
import { expect, test } from './utils/test';

test.use({ storageState: Users.user1.state });

const attrKey = `dept_${Date.now()}`;

const settingIds = [
	'ABAC_Enabled',
	'ABAC_PDP_Type',
	'ABAC_Attribute_Store',
	'ABAC_Enforce_All_Rooms',
	'ABAC_Restrict_To_Owned_Attributes',
	'Federation_Service_Enabled',
];

test.describe.serial('abac-room-creation', () => {
	let poHomeChannel: HomeChannel;
	let asUser1: APIRequestContext;
	let attributeId: string;
	const roomName = `abac-created-${Date.now()}`;

	test.skip(!IS_EE, 'Enterprise Only');

	preserveSettings(settingIds);

	test.beforeAll(async ({ api }) => {
		asUser1 = await request.newContext({
			baseURL: BASE_URL,
			extraHTTPHeaders: { 'X-Auth-Token': Users.user1.data.loginToken, 'X-User-Id': Users.user1.data._id },
		});

		await Promise.all([
			setSettingValueById(api, 'ABAC_Enabled', true),
			setSettingValueById(api, 'ABAC_PDP_Type', 'local'),
			setSettingValueById(api, 'ABAC_Attribute_Store', 'local'),
			setSettingValueById(api, 'ABAC_Enforce_All_Rooms', false),
			setSettingValueById(api, 'ABAC_Restrict_To_Owned_Attributes', true),
		]);

		attributeId = await createAbacAttribute(api, attrKey, ['eng', 'sales']);
		await addUserAbacAttributes(Users.user1.data.username, [{ key: attrKey, values: ['eng'] }]);
	});

	test.afterAll(async ({ api }) => {
		await deletePrivateRoomsByName({ username: Users.user1.data.username, password: DEFAULT_USER_CREDENTIALS.password }, [roomName]);
		await deleteAbacAttribute(api, attributeId);
		await removeUserAbacAttributes([Users.user1.data.username], [attrKey]);
		await asUser1.dispose();
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await poHomeChannel.goto();
	});

	test('a creator who is not an administrator walks the four steps and the room matches the preview', async ({ page }) => {
		const modal = poHomeChannel.navbar.modals.Channel;

		await poHomeChannel.navbar.openCreate('Channel');
		await modal.inputName.fill(roomName);
		await modal.addMember(Users.user2.data.username);
		await expect(modal.getStepIndicator(1, 2)).toBeVisible();

		await modal.checkboxAbacManaged.click();
		await expect(modal.getStepIndicator(1, 4)).toBeVisible();
		await modal.btnNext.click();

		await expect(modal.getStepIndicator(2, 4)).toBeVisible();
		await modal.selectAttribute(attrKey, ['eng']);
		await modal.btnNext.click();

		await expect(modal.getStepIndicator(3, 4)).toBeVisible();
		await expect(modal.checkboxFederated).toHaveCount(0);
		await modal.btnNext.click();

		await expect(modal.getStepIndicator(4, 4)).toBeVisible();
		await expect(modal.getPreviewGroup('Compliant')).toContainText(Users.user1.data.username);
		await expect(modal.getPreviewGroup('Non-compliant')).toContainText(Users.user2.data.username);

		await modal.create();
		await expect(page).toHaveURL(`/group/${roomName}`);

		const room = await getGroupInfo(asUser1, roomName);
		expect(room.abacAttributes).toEqual([{ key: attrKey, values: ['eng'] }]);
		expect(await getGroupMemberUsernames(asUser1, room._id)).toEqual([Users.user1.data.username]);
	});

	test('under enforcement, turning Federated on releases ABAC managed and shortens the flow', async ({ api }) => {
		const modal = poHomeChannel.navbar.modals.Channel;

		await Promise.all([
			setSettingValueById(api, 'ABAC_Enforce_All_Rooms', true),
			setSettingValueById(api, 'Federation_Service_Enabled', true),
		]);
		await poHomeChannel.goto();

		await poHomeChannel.navbar.openCreate('Channel');
		await expect(modal.getStepIndicator(1, 4)).toBeVisible();
		await expect(modal.toggleAbacManaged).toBeChecked();
		await expect(modal.toggleAbacManaged).toBeDisabled();
		await expect(modal.toggleFederated).toBeEnabled();

		await modal.checkboxFederated.click();
		await expect(modal.toggleAbacManaged).not.toBeChecked();
		await expect(modal.toggleAbacManaged).toBeDisabled();
		await expect(modal.getStepIndicator(1, 2)).toBeVisible();

		await modal.checkboxFederated.click();
		await expect(modal.toggleAbacManaged).toBeChecked();
		await expect(modal.getStepIndicator(1, 4)).toBeVisible();

		await modal.close();
	});
});
