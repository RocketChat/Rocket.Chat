import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { createAgent } from '../utils/omnichannel/agents';
import { addAgentToDepartment, createDepartment } from '../utils/omnichannel/departments';
import { createConversation } from '../utils/omnichannel/rooms';
import { createTag } from '../utils/omnichannel/tags';
import { test, expect } from '../utils/test';

const visitorA = createFakeVisitor();
const visitorB = createFakeVisitor();

test.use({ storageState: Users.user1.state });

test.describe('OC - Tags Visibility', () => {
	test.skip(!IS_EE, 'OC - Tags Visibility > Enterprise Edition Only');

	let poOmnichannel: HomeOmnichannel;
	let conversations: Awaited<ReturnType<typeof createConversation>>[] = [];
	let departmentA: Awaited<ReturnType<typeof createDepartment>>;
	let departmentB: Awaited<ReturnType<typeof createDepartment>>;
	let agent: Awaited<ReturnType<typeof createAgent>>;
	let tagA: Awaited<ReturnType<typeof createTag>>;
	let tagB: Awaited<ReturnType<typeof createTag>>;
	let globalTag: Awaited<ReturnType<typeof createTag>>;
	let sharedTag: Awaited<ReturnType<typeof createTag>>;

	test.beforeAll('Create departments', async ({ api }) => {
		departmentA = await createDepartment(api, { name: 'Department A' });
		departmentB = await createDepartment(api, { name: 'Department B' });
	});

	test.beforeAll('Create agent', async ({ api }) => {
		agent = await createAgent(api, 'user1');
	});

	test.beforeAll('Add agents to departments', async ({ api }) => {
		await Promise.all([
			addAgentToDepartment(api, { department: departmentA.data, agentId: 'user1' }),
			addAgentToDepartment(api, { department: departmentB.data, agentId: 'user1' }),
		]);
	});

	test.beforeAll('Create tags', async ({ api }) => {
		tagA = await createTag(api, { departments: [departmentA.data._id] });
		tagB = await createTag(api, { departments: [departmentB.data._id] });
		globalTag = await createTag(api, { departments: [] });
		sharedTag = await createTag(api, {
			departments: [departmentA.data._id, departmentB.data._id],
		});
	});

	test.beforeAll('Create conversations', async ({ api }) => {
		conversations = await Promise.all([
			createConversation(api, { visitorName: visitorA.name, agentId: 'user1', departmentId: departmentA.data._id }),
			createConversation(api, { visitorName: visitorB.name, agentId: 'user1', departmentId: departmentB.data._id }),
		]);
	});

	test.beforeEach(async ({ page }) => {
		poOmnichannel = new HomeOmnichannel(page);
		await page.goto('/');
	});

	test.afterAll(async () => {
		await Promise.all(conversations.map((conversation) => conversation.delete()));
		await Promise.all([tagA, tagB, globalTag, sharedTag].map((tag) => tag.delete()));
		await agent.delete();
		await departmentA.delete();
		await departmentB.delete();
	});

	test('Verify agent should see correct tags based on department association', async () => {
		await test.step('Agent opens room', async () => {
			await poOmnichannel.sidebar.getSidebarItemByName(visitorA.name).click();
		});

		await test.step('should not be able to see tags field', async () => {
			await expect(poOmnichannel.roomInfo.getLabel('Tags')).not.toBeVisible();
		});

		await test.step('check available tags', async () => {
			await poOmnichannel.roomInfo.btnEditRoomInfo.click();
			await expect(poOmnichannel.roomInfo.dialogEditRoom).toBeVisible();
			await poOmnichannel.roomInfo.inputTags.click();
		});

		await test.step('Should see TagA (department A specific)', async () => {
			await expect(poOmnichannel.roomInfo.optionTags(tagA.data.name)).toBeVisible();
		});

		await test.step('Should see SharedTag (both departments)', async () => {
			await expect(poOmnichannel.roomInfo.optionTags(sharedTag.data.name)).toBeVisible();
		});

		await test.step('Should see Public Tags for all chats (no department restriction)', async () => {
			await expect(poOmnichannel.roomInfo.optionTags(globalTag.data.name)).toBeVisible();
		});

		await test.step('Should not see TagB (department B specific)', async () => {
			await expect(poOmnichannel.roomInfo.optionTags(tagB.data.name)).not.toBeVisible();
		});

		await test.step('add tags and save', async () => {
			await poOmnichannel.roomInfo.selectTag(tagA.data.name);
			await poOmnichannel.roomInfo.selectTag(globalTag.data.name);
			await poOmnichannel.roomInfo.btnSaveEditRoom.click();
		});

		await test.step('verify selected tags are displayed under room information', async () => {
			await expect(poOmnichannel.roomInfo.getLabel('Tags')).toBeVisible();
			await expect(poOmnichannel.roomInfo.getTagInfoByLabel(tagA.data.name)).toBeVisible();
			await expect(poOmnichannel.roomInfo.getTagInfoByLabel(globalTag.data.name)).toBeVisible();
		});
	});

	test('Verify tags visibility for agent associated with multiple departments', async () => {
		await test.step('Open room info', async () => {
			await poOmnichannel.sidebar.getSidebarItemByName(visitorB.name).click();
			await poOmnichannel.roomInfo.btnEditRoomInfo.click();
			await expect(poOmnichannel.roomInfo.dialogEditRoom).toBeVisible();
			await poOmnichannel.roomInfo.inputTags.click();
		});

		await test.step('Agent associated with DepartmentB should be able to see tags for Department B', async () => {
			await expect(poOmnichannel.roomInfo.optionTags(tagB.data.name)).toBeVisible();
		});

		await test.step('Agent associated with DepartmentB should not be able to see tags for DepartmentA', async () => {
			await expect(poOmnichannel.roomInfo.optionTags(tagA.data.name)).not.toBeVisible();
		});
	});
});
