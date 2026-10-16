import type { APIRequestContext } from '@playwright/test';
import type { IRoom, ITeam } from '@rocket.chat/core-typings';

import { DEFAULT_USER_CREDENTIALS, IS_EE } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { setSettingValueById } from './utils';
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

test.use({ storageState: Users.user1.state });

const suffix = Date.now();
const deptKey = `dept_${suffix}`;
const levelKey = `level_${suffix}`;
const roomName = `abac-panel-${suffix}`;
const teamName = `abac-panel-team-${suffix}`;

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

test.describe.serial('abac-room-attributes-panel', () => {
	let poHomeChannel: HomeChannel;
	let asUser1: APIRequestContext;
	let rid: string;
	let teamId: string;
	const attributeIds: string[] = [];

	test.skip(!IS_EE, 'Enterprise Only');

	preserveSettings(['ABAC_Enabled', 'ABAC_PDP_Type', 'ABAC_Attribute_Store', 'ABAC_Enforce_All_Rooms', 'ABAC_Required_Attributes']);

	const makeOwnedAbacRoom = async (api: BaseTest['api'], roomId: string) => {
		await setRoomAbacAttributes(api, roomId, { [deptKey]: ['eng'] });
		expect((await api.post('/groups.addOwner', { roomId, userId: Users.user1.data._id })).status()).toBe(200);
	};

	test.beforeAll(async ({ api }) => {
		asUser1 = await api.login({ username: Users.user1.data.username, password: DEFAULT_USER_CREDENTIALS.password });

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

		const groupResponse = await api.post('/groups.create', {
			name: roomName,
			members: [Users.user1.data.username, Users.user2.data.username],
		});
		expect(groupResponse.status()).toBe(200);
		const { group }: { group: IRoom } = await groupResponse.json();
		rid = group._id;
		await makeOwnedAbacRoom(api, rid);

		const teamResponse = await api.post('/teams.create', { name: teamName, type: 1, members: [Users.user1.data.username] });
		expect(teamResponse.status()).toBe(200);
		const { team }: { team: ITeam } = await teamResponse.json();
		teamId = team._id;
		await makeOwnedAbacRoom(api, team.roomId);

		expect(await getGroupMemberUsernames(asUser1, rid)).toHaveLength(3);

		await setSettingValueById(api, 'ABAC_Required_Attributes', [deptKey, levelKey]);
		await setSettingValueById(api, 'ABAC_Enforce_All_Rooms', true);
	});

	test.afterAll(async ({ api }) => {
		await api.post('/rooms.delete', { roomId: rid });
		await api.post('/teams.delete', { teamId });
		for (const attributeId of attributeIds) {
			await deleteAbacAttribute(api, attributeId);
		}
		await removeUserAbacAttributes(Object.keys(userAttributes), [deptKey, levelKey]);
		await asUser1.dispose();
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
	});

	test('a room owner unlocks a locked group from the callout, and only members without the new value are removed', async () => {
		const { abacAttributes, abacManageAttributes } = poHomeChannel.tabs;
		const { preview } = abacManageAttributes;

		await poHomeChannel.gotoGroup(roomName);
		await expect(poHomeChannel.composer.abacLockedFooter).toHaveText('Channel locked. Required ABAC room attributes missing.');

		await poHomeChannel.composer.btnManageAttributes.click();
		await abacManageAttributes.waitForDisplay();
		await abacManageAttributes.back();
		await expect(abacAttributes.getAttribute(levelKey)).toContainText('Not set');

		await poHomeChannel.composer.btnManageAttributes.click();
		await abacManageAttributes.waitForDisplay();
		await expect(abacManageAttributes.btnReviewChanges).toBeDisabled();

		await abacManageAttributes.selectValues(['high']);
		await abacManageAttributes.reviewChanges();

		await expect(preview.losesAccess).toContainText(Users.user2.data.username);
		await expect(preview.losesAccess).not.toContainText(Users.user1.data.username);

		await preview.save();
		await preview.updateRoomModal.save();
		await poHomeChannel.toastMessage.waitForDisplay({ type: 'success', message: 'Room attributes updated' });

		await expect(abacAttributes.getAttribute(levelKey)).toContainText('high');
		await expect(poHomeChannel.composer.abacLockedFooter).not.toBeVisible();

		await expect.poll(() => getGroupMemberUsernames(asUser1, rid)).not.toContain(Users.user2.data.username);
		expect(await getGroupMemberUsernames(asUser1, rid)).toEqual(
			expect.arrayContaining([Users.admin.data.username, Users.user1.data.username]),
		);
	});

	test('a locked team names the team, and its attributes are reachable from the callout and the toolbox', async () => {
		const { abacAttributes, abacManageAttributes } = poHomeChannel.tabs;

		await poHomeChannel.gotoGroup(teamName);
		await expect(poHomeChannel.composer.abacLockedFooter).toHaveText('Team locked. Required ABAC room attributes missing.');

		await poHomeChannel.composer.btnManageAttributes.click();
		await abacManageAttributes.waitForDisplay();
		await abacManageAttributes.close();

		await poHomeChannel.roomToolbar.openABACAttributes();
		await expect(abacAttributes.getAttribute(deptKey)).toContainText('eng');
		await expect(abacAttributes.getAttribute(levelKey)).toContainText('Not set');
	});
});
