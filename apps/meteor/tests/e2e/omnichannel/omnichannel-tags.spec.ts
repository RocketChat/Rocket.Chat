import { faker } from '@faker-js/faker';
import type { Page } from '@playwright/test';

import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { OmnichannelTags } from '../page-objects';
import { createAgent } from '../utils/omnichannel/agents';
import { createDepartment } from '../utils/omnichannel/departments';
import { createTag } from '../utils/omnichannel/tags';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.admin.state });

test.describe('OC - Manage Tags', () => {
  test.skip(!IS_EE, 'OC - Manage Tags > Enterprise Edition Only');

	let poOmnichannelTags: OmnichannelTags;

	let department: Awaited<ReturnType<typeof createDepartment>>;
	let agent: Awaited<ReturnType<typeof createAgent>>;

	test.beforeAll(async ({ api }) => {
		department = await createDepartment(api);
	});

	test.beforeAll(async ({ api }) => {
		agent = await createAgent(api, 'user2');
	});

	test.afterAll(async () => {
		await department.delete();
		await agent.delete();
	});

  test.beforeEach(async ({ page }: { page: Page }) => {
		poOmnichannelTags = new OmnichannelTags(page);
	});

  test('OC - Manage Tags - Create Tag', async ({ page }) => {
    const tagName = faker.string.uuid();

    await page.goto('/omnichannel');
		await poOmnichannelTags.sidenav.linkTags.click();

    await test.step('expect correct form default state', async () => {
			await poOmnichannelTags.btnCreateTag.click();
			await expect(poOmnichannelTags.contextualBar).toBeVisible();
			await expect(poOmnichannelTags.btnSave).toBeDisabled();
			await expect(poOmnichannelTags.btnCancel).toBeEnabled();
			await poOmnichannelTags.btnCancel.click();
			await expect(poOmnichannelTags.contextualBar).not.toBeVisible();
		});

    await test.step('expect to create new tag', async () => {
			await poOmnichannelTags.btnCreateTag.click();
			await poOmnichannelTags.inputName.fill(tagName);
			await poOmnichannelTags.selectDepartment(department.data);
			await poOmnichannelTags.btnSave.click();
			await expect(poOmnichannelTags.contextualBar).not.toBeVisible();

			await test.step('expect tag to have been created', async () => {
				await poOmnichannelTags.search(tagName);
				await expect(poOmnichannelTags.findRowByName(tagName)).toBeVisible();
			});
		});

    await test.step('expect to delete tag', async () => {
			await test.step('expect confirm delete tag', async () => {
				await test.step('expect to be able to cancel delete', async () => {
					await poOmnichannelTags.btnDeleteByName(tagName).click();
					await expect(poOmnichannelTags.confirmDeleteModal).toBeVisible();
					await poOmnichannelTags.btnCancelDeleteModal.click();
					await expect(poOmnichannelTags.confirmDeleteModal).not.toBeVisible();
				});

				await test.step('expect to confirm delete', async () => {
					await poOmnichannelTags.btnDeleteByName(tagName).click();
					await expect(poOmnichannelTags.confirmDeleteModal).toBeVisible();
					await poOmnichannelTags.btnConfirmDeleteModal.click();
					await expect(poOmnichannelTags.confirmDeleteModal).not.toBeVisible();
				});
			});

			await test.step('expect tag to have been deleted', async () => {
				if (await poOmnichannelTags.inputSearch.isVisible()) {
					await poOmnichannelTags.search(tagName);
					await expect(poOmnichannelTags.findRowByName(tagName)).not.toBeVisible();
				} else {
					await expect(page.locator('h3 >> text="No tags yet"')).toBeVisible();
				}
			});
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
		await poOmnichannelTags.sidenav.linkTags.click();

		const department2 = await createDepartment(api);

		await test.step('expect to add tag departments', async () => {
			await poOmnichannelTags.search(tag.name);
			await poOmnichannelTags.findRowByName(tag.name).click();
			await expect(poOmnichannelTags.contextualBar).toBeVisible();
			await poOmnichannelTags.selectDepartment({ name: department2.data.name, _id: department2.data._id });
			await poOmnichannelTags.btnSave.click();
		});

		await test.step('expect department to be in the chosen departments list', async () => {
			await poOmnichannelTags.search(tag.name);
			await poOmnichannelTags.findRowByName(tag.name).click();
			await expect(poOmnichannelTags.contextualBar).toBeVisible();
			await expect(page.getByRole('option', { name: department2.data.name })).toBeVisible();
			await poOmnichannelTags.btnContextualbarClose.click();
		});

		await test.step('expect to remove tag departments', async () => {
			await poOmnichannelTags.search(tag.name);
			await poOmnichannelTags.findRowByName(tag.name).click();
			await expect(poOmnichannelTags.contextualBar).toBeVisible();
			await poOmnichannelTags.selectDepartment({ name: department2.data.name, _id: department2.data._id });
			await poOmnichannelTags.btnSave.click();
		});

		await test.step('expect department to not be in the chosen departments list', async () => {
			await poOmnichannelTags.search(tag.name);
			await poOmnichannelTags.findRowByName(tag.name).click();
			await expect(poOmnichannelTags.contextualBar).toBeVisible();
			await expect(page.getByRole('option', { name: department2.data.name })).toBeHidden();
		});

    await test.step('expect to delete tag', async () => {
			await test.step('expect confirm delete tag', async () => {
        await poOmnichannelTags.btnDeleteByName(tag.name).click();
        await expect(poOmnichannelTags.confirmDeleteModal).toBeVisible();
        await poOmnichannelTags.btnConfirmDeleteModal.click();
        await expect(poOmnichannelTags.confirmDeleteModal).not.toBeVisible();
			});

			await test.step('expect tag to have been deleted', async () => {
				if (await poOmnichannelTags.inputSearch.isVisible()) {
					await poOmnichannelTags.search(tag.name);
					await expect(poOmnichannelTags.findRowByName(tag.name)).not.toBeVisible();
				} else {
					await expect(page.locator('h3 >> text="No tags yet"')).toBeVisible();
				}
			});
		});
	})
});