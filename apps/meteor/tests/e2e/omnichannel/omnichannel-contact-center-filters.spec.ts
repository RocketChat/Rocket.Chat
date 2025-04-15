import { createFakeVisitor } from "../../mocks/data";
import { IS_EE } from "../config/constants";
import { Users } from "../fixtures/userStates";
import { OmnichannelContacts } from "../page-objects/omnichannel-contacts-list";
import { OmnichannelSection } from "../page-objects/omnichannel-section";
import { createAgent, makeAgentAvailable } from "../utils/omnichannel/agents";
import {
  addAgentToDepartment,
  createDepartment,
} from "../utils/omnichannel/departments";
import { createConversation, updateRoom } from "../utils/omnichannel/rooms";
import { createTag } from "../utils/omnichannel/tags";
import { test, expect } from "../utils/test";

const URL = {
  contactCenterChats: "/omnichannel-directory/chats",
};

const visitorA = createFakeVisitor().name;
const visitorB = createFakeVisitor().name;
const visitorC = createFakeVisitor().name;

test.skip(!IS_EE, "OC - Contact center Filters > Enterprise Only");

test.use({ storageState: Users.admin.state });

test.describe("OC - Contact Center [Auto Selection]", async () => {
  let departments: Awaited<ReturnType<typeof createDepartment>>[];
  let conversations: Awaited<ReturnType<typeof createConversation>>[];
  let agents: Awaited<ReturnType<typeof createAgent>>[];
  let tags: Awaited<ReturnType<typeof createTag>>[];
  let poContacts: OmnichannelContacts;
  let poOmniSection: OmnichannelSection;

  // Allow manual on hold
  test.beforeAll(async ({ api }) => {
    const responses = await Promise.all([
      api.post("/settings/Livechat_allow_manual_on_hold", { value: true }),
      api.post(
        "/settings/Livechat_allow_manual_on_hold_upon_agent_engagement_only",
        { value: false },
      ),
    ]);
    responses.forEach((res) => expect(res.status()).toBe(200));
  });

  // Create departments
  test.beforeAll(async ({ api }) => {
    departments = await Promise.all([
      createDepartment(api),
      createDepartment(api),
    ]);
  });

  // Create agents
  test.beforeAll(async ({ api }) => {
    agents = await Promise.all([
      createAgent(api, "user1"),
      createAgent(api, "user2"),
    ]);

    const agentsStatuses = await Promise.all(
      agents.map(({ data: agent }) => makeAgentAvailable(api, agent._id)),
    );

    agentsStatuses.forEach((res) => expect(res.status()).toBe(200));
  });

  // Add agents to departments
  test.beforeAll(async ({ api }) => {
    const [departmentA, departmentB] = departments.map(({ data }) => data);

    const promises = await Promise.all([
      addAgentToDepartment(api, { department: departmentA, agentId: "user1" }),
      addAgentToDepartment(api, { department: departmentB, agentId: "user2" }),
    ]);

    promises.forEach((res) => expect(res.status()).toBe(200));
  });

  // Create tags
  test.beforeAll(async ({ api }) => {
    tags = await Promise.all([
      createTag(api, { name: "tagA" }),
      createTag(api, { name: "tagB" }),
    ]);

    tags.forEach((res) => expect(res.response.status()).toBe(200));
  });

  // Create rooms
  test.beforeAll(async ({ api }) => {
    const [departmentA, departmentB] = departments.map(({ data }) => data);

    conversations = await Promise.all([
      createConversation(api, {
        visitorName: visitorA,
        visitorToken: visitorA,
        agentId: `user1`,
        departmentId: departmentA._id,
      }),
      createConversation(api, {
        visitorName: visitorB,
        visitorToken: visitorB,
        agentId: `user2`,
        departmentId: departmentB._id,
      }),
      createConversation(api, {
        visitorName: visitorC,
        visitorToken: visitorC,
      }),
    ]);

    const [conversationA, conversationB] = conversations.map(
      ({ data }) => data,
    );

    await Promise.all([
      updateRoom(api, {
        roomId: conversationA.room._id,
        visitorId: conversationA.visitor._id,
        tags: ["tagA"],
      }),
      updateRoom(api, {
        roomId: conversationB.room._id,
        visitorId: conversationB.visitor._id,
        tags: ["tagB"],
      }),
    ]);
  });

  test.afterAll(async ({ api }) => {
    await Promise.all([
      // Delete conversations
      ...conversations.map((conversation) => conversation.delete()),
      // Delete departments
      ...departments.map((department) => department.delete()),
      // Delete agents
      ...agents.map((agent) => agent.delete()),
      // Delete tags
      ...tags.map((tag) => tag.delete()),
      // Reset setting
      api.post("/settings/Livechat_allow_manual_on_hold", { value: false }),
      api.post(
        "/settings/Livechat_allow_manual_on_hold_upon_agent_engagement_only",
        { value: true },
      ),
    ]);
  });

  // Change conversation A to on hold and close conversation B
  test.beforeAll(async ({ api }) => {
    const [conversationA, , conversationC] = conversations.map(
      ({ data }) => data,
    );

    const statesPromises = await Promise.all([
      api.post("/livechat/room.onHold", { roomId: conversationA.room._id }),
      api.post("/livechat/room.close", {
        rid: conversationC.room._id,
        token: visitorC,
      }),
    ]);

    statesPromises.forEach((res) => expect(res.status()).toBe(200));
  });

  test.beforeEach(async ({ page }) => {
    poContacts = new OmnichannelContacts(page);
    poOmniSection = new OmnichannelSection(page);
  });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await poOmniSection.btnContactCenter.click();
    await poContacts.clickChats.click();
    await page.waitForURL(URL.contactCenterChats);
  });

  test("OC - Contact Center - Filters", async () => {
    const [departmentA, departmentB] = departments.map(({ data }) => data);

    await test.step("expect to filter by guest", async () => {
      await poContacts.inputSearch.fill(visitorA);
      await expect(poContacts.findRowByName(visitorA)).toBeVisible();
      await expect(poContacts.findRowByName(visitorB)).not.toBeVisible();
      await expect(poContacts.searchChip).toContainText(visitorA);

      await poContacts.inputSearch.fill("");
      await expect(poContacts.findRowByName(visitorA)).toBeVisible();
      await expect(poContacts.findRowByName(visitorB)).toBeVisible();
    });

    await test.step("expect to filter by Served By", async () => {
      await expect(poContacts.findRowByName(visitorA)).toBeVisible();
      await expect(poContacts.findRowByName(visitorB)).toBeVisible();

      await poContacts.clickFilters.click();

      // Select user1
      await poContacts.selectServedBy("user1");
      await expect(poContacts.findRowByName(visitorA)).toBeVisible();
      await expect(poContacts.servedByChip).toContainText("user1");
      await expect(poContacts.findRowByName(visitorB)).not.toBeVisible();

      // Select user2
      await poContacts.closeChip.click();
      await poContacts.selectServedBy("user2");
      await expect(poContacts.findRowByName(visitorB)).toBeVisible();
      await expect(poContacts.servedByChip).toContainText("user2");
      await expect(poContacts.findRowByName(visitorA)).not.toBeVisible();

      // Select all users
      await poContacts.closeChip.click();
      await poContacts.selectServedBy("user1");
      await poContacts.selectServedBy("user2");
      await expect(poContacts.findRowByName(visitorA)).toBeVisible();
      await expect(poContacts.findRowByName(visitorB)).toBeVisible();
      await poContacts.closeChip.click();
    });

    await test.step("expect to filter by status", async () => {
      await poContacts.selectStatus("closed");
      await expect(poContacts.findRowByName(visitorA)).not.toBeVisible();
      await expect(poContacts.findRowByName(visitorB)).not.toBeVisible();
      await expect(poContacts.findRowByName(visitorC)).toBeVisible();
      await expect(poContacts.statusChip).toContainText("Closed");

      await poContacts.selectStatus("opened");
      await expect(poContacts.findRowByName(visitorA)).not.toBeVisible();
      await expect(poContacts.findRowByName(visitorB)).toBeVisible();
      await expect(poContacts.findRowByName(visitorC)).not.toBeVisible();
      await expect(poContacts.statusChip).toContainText("Open");

      await poContacts.selectStatus("onhold");
      await expect(poContacts.findRowByName(visitorA)).toBeVisible();
      await expect(poContacts.findRowByName(visitorB)).not.toBeVisible();
      await expect(poContacts.findRowByName(visitorC)).not.toBeVisible();
      await expect(poContacts.statusChip).toContainText("On hold");

      await poContacts.selectStatus("all");
      await expect(poContacts.findRowByName(visitorA)).toBeVisible();
      await expect(poContacts.findRowByName(visitorB)).not.toBeVisible();
      await expect(poContacts.findRowByName(visitorC)).not.toBeVisible();
    });

    await test.step("expect to filter by department", async () => {
      // select department A
      await poContacts.selectDepartment(departmentA.name);
      await expect(poContacts.findRowByName(visitorA)).toBeVisible();
      await expect(poContacts.findRowByName(visitorB)).not.toBeVisible();
      await expect(poContacts.findRowByName(visitorC)).not.toBeVisible();
      await expect(poContacts.departmentChip).toContainText(departmentA.name);
      await poContacts.closeChip.click();

      // select department B
      await poContacts.selectDepartment(departmentB.name);
      await expect(poContacts.findRowByName(visitorA)).not.toBeVisible();
      await expect(poContacts.findRowByName(visitorB)).toBeVisible();
      await expect(poContacts.findRowByName(visitorC)).not.toBeVisible();
      await expect(poContacts.departmentChip).toContainText(departmentB.name);
      await poContacts.closeChip.click();

      // select all departments
      await poContacts.selectDepartment(departmentA.name);
      await poContacts.selectDepartment(departmentB.name);
      await expect(poContacts.findRowByName(visitorA)).toBeVisible();
      await expect(poContacts.findRowByName(visitorB)).toBeVisible();
    });

    await test.step("expect to filter by tags", async () => {
      await poContacts.addTag("tagA");
      await expect(poContacts.findRowByName(visitorA)).toBeVisible();
      await expect(poContacts.findRowByName(visitorB)).not.toBeVisible();

      await poContacts.addTag("tagB");
      await expect(poContacts.findRowByName(visitorA)).toBeVisible();
      await expect(poContacts.findRowByName(visitorB)).toBeVisible();

      await poContacts.removeTag("tagA");
      await expect(poContacts.findRowByName(visitorB)).toBeVisible();
      await expect(poContacts.findRowByName(visitorA)).not.toBeVisible();

      await poContacts.removeTag("tagB");
      await expect(poContacts.findRowByName(visitorB)).toBeVisible();
      await expect(poContacts.findRowByName(visitorA)).toBeVisible();
    });
  });

  test("Clear all applied Filters", async () => {
    const [departmentA] = departments.map(({ data }) => data);

    await test.step("expect to display result as per applied filters ", async () => {
      await poContacts.clickFilters.click();
      await poContacts.selectServedBy("user1");
      await poContacts.selectStatus("onhold");
      await poContacts.selectDepartment(departmentA.name);
      await poContacts.addTag("tagA");

      await expect(poContacts.findRowByName(visitorA)).toBeVisible();
      await expect(poContacts.findRowByName(visitorB)).not.toBeVisible();
      await expect(poContacts.findRowByName(visitorC)).not.toBeVisible();
    });

    await test.step("expect to clear all filters ", async () => {
      await poContacts.clearFilters.click();
      await expect(poContacts.findRowByName(visitorA)).toBeVisible();
      await expect(poContacts.findRowByName(visitorB)).toBeVisible();
      await expect(poContacts.findRowByName(visitorC)).toBeVisible();
    });
  });

  test("Close contextual bar with filter screen", async () => {
    await test.step("expect to close filters contextual bar ", async () => {
      await poContacts.clickFilters.click();
      await poContacts.close.click();
    });
  });
});
