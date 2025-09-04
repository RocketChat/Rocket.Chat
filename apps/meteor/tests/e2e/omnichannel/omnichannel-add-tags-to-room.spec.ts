import { createFakeVisitor } from '../../mocks/data';
import { IS_EE } from '../config/constants';
import { createAuxContext } from '../fixtures/createAuxContext';
import { Users } from '../fixtures/userStates';
import { HomeOmnichannel } from '../page-objects';
import { createAgent } from '../utils/omnichannel/agents';
import { addAgentToDepartment, createDepartment } from '../utils/omnichannel/departments';
import { createConversation } from '../utils/omnichannel/rooms';
import { createTag } from '../utils/omnichannel/tags';
import { test, expect } from '../utils/test';

const visitorA = createFakeVisitor();
const visitorB = createFakeVisitor();

test.describe('OC - Tags Visibility and Behavior', () => {
	test.skip(!IS_EE, 'OC - Tags Visibility and Behavior > Enterprise Edition Only');

	let poAgentA: HomeOmnichannel;
	let poAgentB: HomeOmnichannel;
	let conversations: Awaited<ReturnType<typeof createConversation>>[] = [];

	// Departments
	let departmentA: Awaited<ReturnType<typeof createDepartment>>;
	let departmentB: Awaited<ReturnType<typeof createDepartment>>;

	// Agents
	let agentA: Awaited<ReturnType<typeof createAgent>>;
	let agentB: Awaited<ReturnType<typeof createAgent>>;

	// Tags
	let tags: Awaited<ReturnType<typeof createTag>>[] = [];

	test.beforeAll(async ({ api, browser }) => {
		// Create departments
		departmentA = await createDepartment(api, { name: 'Department A' });
		departmentB = await createDepartment(api, { name: 'Department B' });

		// Create agents
		agentA = await createAgent(api, 'user1');
		agentB = await createAgent(api, 'user2');

		// Add agents to departments
		await addAgentToDepartment(api, { department: departmentA.data, agentId: agentA.data._id });
		await addAgentToDepartment(api, { department: departmentB.data, agentId: agentB.data._id });

		// Create tags
		tags = await Promise.all([
			createTag(api, { name: 'TagA', description: 'tag A', departments: [departmentA.data._id] }),
			createTag(api, { name: 'TagB', description: 'tag B', departments: [departmentB.data._id] }),
			createTag(api, { name: 'GlobalTag', description: 'public tag', departments: [] }),
			createTag(api, {
				name: 'SharedTag',
				description: 'tag for both departments',
				departments: [departmentA.data._id, departmentB.data._id],
			}),
		]);

		// Create conversations
		conversations = await Promise.all([
			createConversation(api, { visitorName: visitorA.name, agentId: 'user1' }),
			createConversation(api, { visitorName: visitorB.name, agentId: 'user2' }),
		]);

		// Create separate contexts for each agent
		const { page: agentAPage } = await createAuxContext(browser, Users.user1, '/', true);
		poAgentA = new HomeOmnichannel(agentAPage);

		const { page: agentBPage } = await createAuxContext(browser, Users.user2, '/', true);
		poAgentB = new HomeOmnichannel(agentBPage);
	});

	test.afterEach(async () => {
		// Close agent pages
		await poAgentA.page.close();
		await poAgentB.page.close();
	});

	test.afterAll(async () => {
		// Clean up conversations, departments, agents, and tags
		await Promise.all(conversations.map((conversation) => conversation.delete()));
		await Promise.all(tags.map((tag) => tag.delete()));
		await departmentA.delete();
		await departmentB.delete();
		await agentA.delete();
		await agentB.delete();
	});

	test('should display department specific tags', async () => {
		await test.step('AgentA opens visitorA room and adds tags', async () => {
			await poAgentA.sidenav.getSidebarItemByName(visitorA.name).click();
			await poAgentA.roomInfo.btnEditRoomInfo.click();
		});

		await test.step('should display department specific, shared and global tags', async () => {
			// Open the tag dropdown to check available options
			await poAgentA.roomInfo.inputTags.click();
			await expect(poAgentA.roomInfo.optionTags('TagA')).toBeVisible();
			await expect(poAgentA.roomInfo.optionTags('SharedTag')).toBeVisible();
			await expect(poAgentA.roomInfo.optionTags('GlobalTag')).toBeVisible();
		});

		await test.step('should not display tags specific to departmentB', async () => {
			await expect(poAgentA.roomInfo.optionTags('TagB')).not.toBeVisible();
		});

		await test.step('add tags and save', async () => {
			await poAgentA.roomInfo.selectTags('TagA');
			await poAgentA.roomInfo.selectTags('GlobalTag');
			await poAgentA.roomInfo.btnSaveEditRoom.click();
		});

		await test.step('verify selected tags are displayed under room information', async () => {
			await test.step('AgentA opens visitorA room again to verify tags', async () => {
				await poAgentA.sidenav.getSidebarItemByName(visitorA.name).click();
			});

			await test.step('Should be able to see selected tags', async () => {
				await expect(poAgentA.roomInfo.getTagInfoByLabel('TagA')).toBeVisible();
				await expect(poAgentA.roomInfo.getTagInfoByLabel('GlobalTag')).toBeVisible();
			});
		});
	});

	test('AgentB (Department B) manages visitorB conversation and tags', async () => {
		await test.step('AgentB opens visitorB room', async () => {
			await poAgentB.sidenav.getSidebarItemByName(visitorB.name).click();
			await poAgentB.roomInfo.btnEditRoomInfo.click();
		});

		await test.step('should display tags for departmentB, shared and global tags', async () => {
			await poAgentB.roomInfo.selectTags('TagB');
			await poAgentB.roomInfo.selectTags('SharedTag');
			await poAgentB.roomInfo.selectTags('GlobalTag');
			await poAgentB.roomInfo.btnSaveEditRoom.click();
		});
		await test.step('should not display tags specific to departmentB', async () => {
			await expect(poAgentB.roomInfo.optionTags('TagA')).not.toBeVisible();
		});

		await test.step('add tags and save', async () => {
			await poAgentB.roomInfo.selectTags('TagB');
			await poAgentB.roomInfo.selectTags('SharedTag');
			await poAgentB.roomInfo.btnSaveEditRoom.click();
		});

		await test.step('AgentB verifies tag visibility for visitorB', async () => {
			await expect(poAgentB.roomInfo.getTagInfoByLabel('TagB')).toBeVisible();
			await expect(poAgentB.roomInfo.getTagInfoByLabel('SharedTag')).toBeVisible();
		});
	});
});
