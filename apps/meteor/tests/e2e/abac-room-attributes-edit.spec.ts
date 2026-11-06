import type { APIRequestContext } from '@playwright/test';
import { request } from '@playwright/test';

import { BASE_URL, IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { AdminABACRooms } from './page-objects';
import { createTargetGroupAndReturnFullRoom, setSettingValueById } from './utils';
import {
	addUserAbacAttributes,
	createAbacAttribute,
	deleteAbacAttribute,
	getGroupMemberUsernames,
	removeUserAbacAttributes,
	setRoomAbacAttributes,
} from './utils/abac';
import { preserveSettings } from './utils/preserveSettings';
import type { BaseTest } from './utils/test';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });

const suffix = Date.now();
const deptKey = `dept_${suffix}`;
const levelKey = `level_${suffix}`;

const userAttributes = {
	[Users.admin.data.username]: [
		{ key: deptKey, values: ['eng'] },
		{ key: levelKey, values: ['high'] },
	],
	[Users.user1.data.username]: [
		{ key: deptKey, values: ['eng'] },
		{ key: levelKey, values: ['high', 'low'] },
	],
	[Users.user2.data.username]: [{ key: deptKey, values: ['eng'] }],
};

test.describe.serial('abac-room-attributes-edit', () => {
	let poAdminABACRooms: AdminABACRooms;
	let asUser1: APIRequestContext;
	const attributeIds: string[] = [];
	const roomIds: string[] = [];

	test.skip(!IS_EE, 'Enterprise Only');

	preserveSettings(['ABAC_Enabled', 'ABAC_PDP_Type', 'ABAC_Attribute_Store', 'ABAC_Enforce_All_Rooms']);

	const createRoom = async (api: BaseTest['api']) => {
		const { group } = await createTargetGroupAndReturnFullRoom(api, { members: [Users.user1.data.username, Users.user2.data.username] });
		roomIds.push(group._id);

		await setRoomAbacAttributes(api, group._id, { [deptKey]: ['eng'] });
		expect(await getGroupMemberUsernames(asUser1, group._id)).toHaveLength(3);

		return group;
	};

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
		]);

		attributeIds.push(await createAbacAttribute(api, deptKey, ['eng', 'sales']), await createAbacAttribute(api, levelKey, ['high', 'low']));

		for (const [username, attributes] of Object.entries(userAttributes)) {
			await addUserAbacAttributes(username, attributes);
		}
	});

	test.afterAll(async ({ api }) => {
		for (const roomId of roomIds) {
			await api.post('/rooms.delete', { roomId });
		}
		for (const attributeId of attributeIds) {
			await deleteAbacAttribute(api, attributeId);
		}
		await removeUserAbacAttributes(Object.keys(userAttributes), [deptKey, levelKey]);
		await asUser1.dispose();
	});

	test.beforeEach(async ({ page }) => {
		poAdminABACRooms = new AdminABACRooms(page);
	});

	test('an administrator sees who loses access, confirms the update, and only they are removed', async ({ api }) => {
		const { _id: rid } = await createRoom(api);
		const { preview } = poAdminABACRooms;

		await poAdminABACRooms.gotoEditRoom(rid);
		await expect(poAdminABACRooms.btnReviewChanges).toBeDisabled();
		await poAdminABACRooms.addAttribute(levelKey, ['high']);
		await poAdminABACRooms.reviewChanges();

		await expect(preview.listLosesAccess).toContainText(Users.user2.data.username);
		await expect(preview.listLosesAccess).not.toContainText(Users.user1.data.username);
		await expect(preview.listLosesAccess).not.toContainText(Users.admin.data.username);

		await preview.save();
		await preview.updateRoomModal.waitForDisplay();

		await preview.updateRoomModal.save();
		await poAdminABACRooms.toastMessage.waitForDisplay({ type: 'success', message: 'Room attributes updated' });

		await expect
			.poll(() => getGroupMemberUsernames(asUser1, rid))
			.toEqual(expect.arrayContaining([Users.admin.data.username, Users.user1.data.username]));
		expect(await getGroupMemberUsernames(asUser1, rid)).not.toContain(Users.user2.data.username);
	});

	test('an administrator who would lose access has to confirm, and is removed with the others', async ({ api }) => {
		const { _id: rid } = await createRoom(api);
		const { preview } = poAdminABACRooms;

		await poAdminABACRooms.gotoEditRoom(rid);
		await expect(poAdminABACRooms.btnReviewChanges).toBeDisabled();
		await poAdminABACRooms.addAttribute(levelKey, ['low']);
		await poAdminABACRooms.reviewChanges();

		await expect(preview.listLosesAccess).toContainText(Users.user2.data.username);
		await expect(preview.listLosesAccess).toContainText(Users.admin.data.username);

		await preview.save();
		await preview.selfLockoutModal.waitForDisplay();

		await preview.selfLockoutModal.save();
		await poAdminABACRooms.toastMessage.waitForDisplay({ type: 'success', message: 'Room attributes updated' });

		await expect.poll(() => getGroupMemberUsernames(asUser1, rid)).toEqual([Users.user1.data.username]);
	});
});
