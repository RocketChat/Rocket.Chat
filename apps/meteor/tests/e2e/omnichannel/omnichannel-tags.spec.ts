import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { OmnichannelTags } from '../page-objects/omnichannel';
import { createAgent } from '../utils/omnichannel/agents';
import { createDepartment } from '../utils/omnichannel/departments';
import { createTag } from '../utils/omnichannel/tags';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.admin.state });

test.describe('OC - Manage Tags', () => {
	test.skip(!IS_EE, 'OC - Manage Tags > Enterprise Edition Only');

	let poOmnichannelTags: OmnichannelTags;

	let department: Awaited<ReturnType<typeof createDepartment>>;
	let department2: Awaited<ReturnType<typeof createDepartment>>;
	let agent: Awaited<ReturnType<typeof createAgent>>;

	test.beforeAll(async ({ api }) => {
		department = await createDepartment(api);
		department2 = await createDepartment(api);
	});

	test.beforeAll(async ({ api }) => {
		agent = await createAgent(api, 'user2');
	});

	test.afterAll(async () => {
		await department.delete();
		await department2.delete();
		await agent.delete();
	});

	test.beforeEach(async ({ page }: { page: Page }) => {
		poOmnichannelTags = new OmnichannelTags(page);
	});

	test('OC - Manage Tags - Create Tag', async ({ page }) => {
		const tagName = faker.string.uuid();

		await page.goto('/omnichannel');
		await poOmnichannelTags.sidebar.linkTags.click();

		await test.step('expect correct form default state', async () => {
			await poOmnichannelTags.btnCreateTag.click();
			await expect(poOmnichannelTags.editTag.root).toBeVisible();
			await expect(poOmnichannelTags.editTag.btnSave).toBeDisabled();
			await expect(poOmnichannelTags.editTag.btnCancel).toBeEnabled();
			await poOmnichannelTags.editTag.btnCancel.click();
			await expect(poOmnichannelTags.editTag.root).not.toBeVisible();
		});

		await test.step('expect to create new tag', async () => {
			await poOmnichannelTags.btnCreateTag.click();
			await poOmnichannelTags.editTag.inputName.fill(tagName);
			await poOmnichannelTags.editTag.selectDepartment(department.data.name);
			await poOmnichannelTags.editTag.btnSave.click();
			await expect(poOmnichannelTags.editTag.root).not.toBeVisible();

			await test.step('expect tag to have been created', async () => {
				await poOmnichannelTags.search(tagName);
				await expect(poOmnichannelTags.table.findRowByName(tagName)).toBeVisible();
			});
		});

		await test.step('should be able to delete tag', async () => {
			await poOmnichannelTags.deleteTag(tagName);
			await expect(page.locator('h3 >> text="No results found"')).toBeVisible();
		});
	});

	test('OC - Manage Tags - Edit tag departments', async ({ api, page }) => {
		const tag = await test.step('expect to create new tag', async () => {
			const { data: tag } = await createTag(api, {
				name: faker.string.uuid(),
				departments: [department.data._id],
			});

			return tag;
		});

		await page.goto('/omnichannel');
		await poOmnichannelTags.sidebar.linkTags.click();

		await test.step('expect to add tag departments', async () => {
			await poOmnichannelTags.search(tag.name);
			await poOmnichannelTags.table.findRowByName(tag.name).click();
			await expect(poOmnichannelTags.editTag.root).toBeVisible();
			await poOmnichannelTags.editTag.selectDepartment(department2.data.name);
			await poOmnichannelTags.editTag.btnSave.click();
		});

		await test.step('expect department to be in the chosen departments list', async () => {
			await poOmnichannelTags.search(tag.name);
			await poOmnichannelTags.table.findRowByName(tag.name).click();
			await expect(poOmnichannelTags.editTag.root).toBeVisible();
			await expect(poOmnichannelTags.editTag.inputDepartments).toBeVisible();
			await poOmnichannelTags.editTag.close();
		});

		await test.step('expect to remove tag departments', async () => {
			await poOmnichannelTags.search(tag.name);
			await poOmnichannelTags.table.findRowByName(tag.name).click();
			await expect(poOmnichannelTags.editTag.root).toBeVisible();
			await poOmnichannelTags.editTag.selectDepartment(department2.data.name);
			await poOmnichannelTags.editTag.btnSave.click();
		});

		await test.step('expect department to not be in the chosen departments list', async () => {
			await poOmnichannelTags.search(tag.name);
			await poOmnichannelTags.table.findRowByName(tag.name).click();
			await expect(poOmnichannelTags.editTag.root).toBeVisible();
			await expect(page.getByRole('option', { name: department2.data.name })).toBeHidden();
		});

		await test.step('expect to delete tag', async () => {
			await poOmnichannelTags.deleteTag(tag.name);
			await expect(page.locator('h3 >> text="No results found"')).toBeVisible();
		});
	});
});
