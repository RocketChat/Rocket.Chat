import { faker } from '@faker-js/faker';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { MongoClient } from 'mongodb';

import { IS_EE, URL_MONGODB } from './config/constants';
import { Users } from './fixtures/userStates';
import { HomeChannel } from './page-objects';
import { createTargetGroupAndReturnFullRoom, deleteRoom, setSettingValueById } from './utils';
import { expect, test } from './utils/test';

test.use({ storageState: Users.admin.state });

const attrKey = `clearance${Date.now()}`;

/**
 * ABAC Phase 4 — the two headline journeys from the test plan:
 * creating a room through the four-step flow, and editing a room's attributes through the
 * membership-impact preview and its confirmation.
 *
 * Both run against the local PDP, which decides from the database rather than an external service,
 * so the outcomes are deterministic. The admin is given the matching subject attribute directly in
 * the database — the same approach the classification-banner spec takes — because the local PDP
 * keeps only members whose own attributes match the room's.
 */
test.describe.serial('abac-enforcement', () => {
	let poHomeChannel: HomeChannel;
	let connection: MongoClient;
	let attributeId: string;
	let lockedRoom: IRoom;

	test.skip(!IS_EE, 'Enterprise Only');

	test.beforeAll(async ({ api }) => {
		connection = await MongoClient.connect(URL_MONGODB);

		await Promise.all([
			setSettingValueById(api, 'ABAC_Enabled', true),
			setSettingValueById(api, 'ABAC_PDP_Type', 'local'),
			setSettingValueById(api, 'ABAC_Attribute_Store', 'local'),
			// Off while the fixtures are built: under enforcement a room cannot be created without
			// attributes, and this one has to exist unattributed so it is locked.
			setSettingValueById(api, 'ABAC_Enforce_All_Rooms', false),
			// Stated rather than assumed: with no workspace-required attributes, the creation flow's
			// attribute step opens with no rows, which is what the flow test walks through.
			setSettingValueById(api, 'ABAC_Required_Attributes', []),
		]);

		expect((await api.post('/abac/attributes', { key: attrKey, values: ['secret', 'topsecret'] })).status()).toBe(200);
		const { attributes } = await (await api.get('/abac/attributes', { key: attrKey })).json();
		attributeId = attributes.find((attribute: { key: string }) => attribute.key === attrKey)._id;

		await connection
			.db()
			.collection<IUser>('users')
			.updateOne({ username: Users.admin.data.username }, { $push: { abacAttributes: { key: attrKey, values: ['secret', 'topsecret'] } } });

		({ group: lockedRoom } = await createTargetGroupAndReturnFullRoom(api));
	});

	test.afterAll(async ({ api }) => {
		await setSettingValueById(api, 'ABAC_Enforce_All_Rooms', false);
		await deleteRoom(api, lockedRoom._id);
		await api.delete(`/abac/attributes/${attributeId}`);

		await connection
			.db()
			.collection<IUser>('users')
			.updateOne({ username: Users.admin.data.username }, { $pull: { abacAttributes: { key: attrKey } } });
		await connection.close();

		await setSettingValueById(api, 'ABAC_Enabled', false);
	});

	test.beforeEach(async ({ page }) => {
		poHomeChannel = new HomeChannel(page);
		await page.goto('/home');
	});

	test('locks a room that carries no attributes once enforcement is on', async ({ page, api }) => {
		await setSettingValueById(api, 'ABAC_Enforce_All_Rooms', true);

		await poHomeChannel.navbar.openChat(lockedRoom.name as string);

		// The composer is replaced by the locked callout, and the owner is offered the way out.
		await expect(page.getByText('ABAC-managed workspace. Set room attributes to unlock this channel.')).toBeVisible();
		await expect(poHomeChannel.composer.inputMessage).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Edit channel', exact: true })).toBeVisible();
	});

	test('creates a room through the four-step flow', async ({ page }) => {
		const channelName = faker.string.uuid();

		await poHomeChannel.navbar.openCreate('Channel');

		const dialog = page.getByRole('dialog');

		// Step 1 — enforcement locks ABAC-managed on, which forces Private on.
		await expect(dialog.getByText('Step 1 of 4')).toBeVisible();
		await expect(dialog.getByRole('checkbox', { name: 'ABAC Managed' })).toBeDisabled();
		await expect(dialog.getByRole('checkbox', { name: 'Private' })).toBeDisabled();

		await dialog.getByRole('textbox', { name: 'Name' }).fill(channelName);
		await dialog.getByRole('button', { name: 'Next' }).click();

		// Step 2 — room attributes. No workspace-required attributes are configured here, so the step
		// opens with no rows and one has to be added. Both inputs in a row are labelled by the same
		// "Attribute" field label, so they are told apart by their placeholders rather than by name.
		await expect(dialog.getByText('Step 2 of 4')).toBeVisible();
		await dialog.getByRole('button', { name: 'Add Attribute' }).click();
		await dialog.getByPlaceholder('Search attribute').click();
		await page.getByRole('option', { name: attrKey }).click();
		await dialog.getByPlaceholder('Select attribute values').click();
		await page.getByRole('option', { name: 'secret', exact: true }).click();
		await dialog.getByRole('button', { name: 'Next' }).click();

		// Step 3 — the existing security and permissions controls.
		await expect(dialog.getByText('Step 3 of 4')).toBeVisible();
		await dialog.getByRole('button', { name: 'Next' }).click();

		// Step 4 — the member compliance preview, with the creator compliant.
		await expect(dialog.getByText('Step 4 of 4')).toBeVisible();
		await expect(dialog.getByText('Only attribute-compliant users can be added to ABAC rooms.')).toBeVisible();
		// Exact: the step also carries "attribute-compliant" in its callout and can carry a
		// "Non-compliant" group, both of which a substring match would collide with.
		await expect(dialog.getByText('Compliant', { exact: true })).toBeVisible();

		const btnCreate = dialog.getByRole('button', { name: 'Create' });
		await expect(btnCreate).toBeEnabled();
		await btnCreate.click();

		await expect(page).toHaveURL(`/group/${channelName}`);

		// Created with its attributes, so it is not locked: the composer is there.
		await expect(poHomeChannel.composer.inputMessage).toBeVisible();
	});

	test('shows the membership impact before an attribute change is committed', async ({ page, api }) => {
		await setSettingValueById(api, 'ABAC_Enforce_All_Rooms', false);

		const { group: room } = await createTargetGroupAndReturnFullRoom(api);
		expect((await api.put(`/abac/rooms/${room._id}/attributes/${attrKey}`, { values: ['secret'] })).status()).toBe(200);

		await poHomeChannel.navbar.openChat(room.name as string);
		await poHomeChannel.roomToolbar.openRoomInfo();
		await poHomeChannel.tabs.room.btnEdit.click();

		await page.getByRole('button', { name: 'Room attributes (ABAC)' }).click();

		// Narrowing the attribute to a value the admin still holds keeps them in the room, so the
		// preview should report nobody removed — and nothing is committed until it is confirmed.
		// The section opens with the room's existing attribute already in a row, so there is nothing
		// to add — only the values to narrow.
		await page.getByPlaceholder('Select attribute values').click();
		await page.getByRole('option', { name: 'topsecret' }).click();

		await page.getByRole('button', { name: 'Next' }).click();

		await expect(page.getByText('No members will be removed')).toBeVisible();

		await page.getByRole('button', { name: 'Save changes' }).click();

		// The confirmation is the last point at which the change can be abandoned.
		const confirmation = page.getByRole('dialog');
		await expect(confirmation.getByText('Update ABAC room')).toBeVisible();
		await confirmation.getByRole('button', { name: 'Save changes' }).click();

		await expect(page.getByText('Room attributes updated')).toBeVisible();

		await deleteRoom(api, room._id);
	});
});
