import fs from 'fs';
import * as path from 'path';

import { parse } from 'csv-parse';

import { Users } from './fixtures/userStates';
import { AdminImports, AdminRooms, AdminUsers } from './page-objects';
import { test, expect } from './utils/test';

test.use({ storageState: Users.admin.state, viewport: { width: 1280, height: 720 } });

type csvRoomSpec = {
	name: string;
	ownerUsername: string;
	visibility: 'public' | 'private';
	members: string;
};

const rowUserName: string[] = [];
const csvImportedUsernames: string[] = [];
const dmMessages: string[] = [];
const importedRooms: csvRoomSpec[] = [];
const slackCsvDir = path.resolve(__dirname, 'fixtures', 'files', 'slack_export_users.csv');
const zipCsvImportDir = path.resolve(__dirname, 'fixtures', 'files', 'csv_import.zip');

// These files have the same content from users.csv, channels.csv and messages1.csv from the zip file
// They have been extracted just so that we don't need to do that on the fly
const usersCsvDir = path.resolve(__dirname, 'fixtures', 'files', 'csv_import_users.csv');
const roomsCsvDir = path.resolve(__dirname, 'fixtures', 'files', 'csv_import_rooms.csv');
const dmMessagesCsvDir = path.resolve(__dirname, 'fixtures', 'files', 'dm_messages.csv');

const usersCsvsToJson = async (): Promise<void> => {
	await new Promise((resolve) =>
		fs
			.createReadStream(slackCsvDir)
			.pipe(parse({ delimiter: ',', from_line: 2 }))
			.on('data', (rows) => {
				rowUserName.push(rows[0]);
			})
			.on('end', resolve),
	);

	await new Promise((resolve) =>
		fs
			.createReadStream(usersCsvDir)
			.pipe(parse({ delimiter: ',' }))
			.on('data', (rows) => {
				rowUserName.push(rows[0]);
				if (rows[0] !== 'billy.billy') {
					csvImportedUsernames.push(rows[0]);
				}
			})
			.on('end', resolve),
	);
};

const countDmMessages = (): Promise<void> =>
	new Promise((resolve) =>
		fs
			.createReadStream(dmMessagesCsvDir)
			.pipe(parse({ delimiter: ',' }))
			.on('data', (rows) => {
				dmMessages.push(rows[3]);
			})
			.on('end', resolve),
	);

const roomsCsvToJson = (): Promise<void> =>
	new Promise((resolve) =>
		fs
			.createReadStream(roomsCsvDir)
			.pipe(parse({ delimiter: ',' }))
			.on('data', (rows) => {
				importedRooms.push({
					name: rows[0],
					ownerUsername: rows[1],
					visibility: rows[2],
					members: rows[3],
				});
			})
			.on('end', resolve),
	);

test.describe.serial('imports', () => {
	test.beforeAll(async () => {
		await usersCsvsToJson();
		await roomsCsvToJson();
		await countDmMessages();
	});

	test('expect import users data from slack', async ({ page }) => {
		const poAdminImports = new AdminImports(page);
		await page.goto('/admin/import');

		await poAdminImports.btnImportNewFile.click();

		await (await poAdminImports.getOptionFileType("Slack's Users CSV")).click();

		await poAdminImports.inputFile.setInputFiles(slackCsvDir);
		await poAdminImports.btnImport.click();

		await poAdminImports.btnStartImport.click();

		await expect(poAdminImports.importStatusTableFirstRowCell).toBeVisible({
			timeout: 30_000,
		});
	});

	test('expect import users data from zipped CSV files', async ({ page }) => {
		const poAdminImports = new AdminImports(page);
		await page.goto('/admin/import');

		await poAdminImports.btnImportNewFile.click();

		await (await poAdminImports.getOptionFileType('CSV')).click();

		await poAdminImports.inputFile.setInputFiles(zipCsvImportDir);
		await poAdminImports.btnImport.click();

		await poAdminImports.findFileCheckboxByUsername('billy.billy').click();

		await poAdminImports.btnStartImport.click();

		await expect(poAdminImports.importStatusTableFirstRowCell).toBeVisible({
			timeout: 30_000,
		});
	});

	test('expect all imported users to be actually listed as users', async ({ page }) => {
		const poAdmin = new AdminUsers(page);
		await page.goto('/admin/users');

		for await (const user of rowUserName) {
			const searchResponse = page.waitForResponse((response) => {
				const url = new URL(response.url());
				return url.pathname.endsWith('/api/v1/users.listByStatus') && url.searchParams.get('searchTerm') === user && response.ok();
			});
			await poAdmin.fillUserSearch(user);
			await searchResponse;
			if (user === 'billy.billy') {
				await expect(page.getByRole('heading', { name: 'No users' })).toBeVisible();
				await expect(poAdmin.getUserRowByUsername(user)).not.toBeVisible();
			} else {
				await expect(poAdmin.getUserRowByUsername(user)).toBeVisible();
			}
		}
	});

	test('expect all imported rooms to be actually listed as rooms with correct members count', async ({ page }) => {
		const poAdmin: AdminRooms = new AdminRooms(page);
		await page.goto('/admin/rooms');

		for await (const room of importedRooms) {
			await poAdmin.inputSearchRooms.fill(room.name);

			const expectedMembersCount = room.members.split(';').filter((username) => username && username !== room.ownerUsername).length + 1;
			await expect(poAdmin.getRoomUsersCountCell(room.name, expectedMembersCount)).toHaveText(String(expectedMembersCount));
		}
	});

	test('expect all imported rooms to have correct room type and owner', async ({ page }) => {
		const poAdmin = new AdminRooms(page);
		await page.goto('/admin/rooms');

		for await (const room of importedRooms) {
			await poAdmin.inputSearchRooms.fill(room.name);
			await poAdmin.getRoomRow(room.name).click();

			if (room.visibility === 'private') {
				await expect(poAdmin.editRoom.privateInput).toBeChecked();
			} else {
				await expect(poAdmin.editRoom.privateInput).not.toBeChecked();
			}
			await expect(poAdmin.editRoom.roomOwnerInput).toHaveValue(room.ownerUsername);
		}
	});

	test('expect imported DM to be actually listed as a room with correct members and messages count', async ({ page }) => {
		const poAdmin = new AdminRooms(page);
		await page.goto('/admin/rooms');

		for await (const user of csvImportedUsernames) {
			await poAdmin.inputSearchRooms.fill(user);
			const roomRow = poAdmin.getRoomRow(user);
			await expect(roomRow).toBeVisible();

			const expectedMembersCount = 2;
			await expect(poAdmin.getRoomUsersCountCell(user, expectedMembersCount)).toHaveText(String(expectedMembersCount));

			const expectedMessagesCount = dmMessages.length;
			await expect(poAdmin.getRoomMessagesCountCell(user, expectedMessagesCount)).toHaveText(String(expectedMessagesCount));
		}
	});
});
