import { Users } from '../fixtures/userStates';
import { test, expect } from '../utils/test';

test.use({ storageState: Users.admin.state });

test.describe.parallel('Omnichannel current chats', () => {
  test.beforeEach(async ({ page }) =>{
    await page.goto('/omnichannel/current')
  })

	test.skip('should not have any accessibility violations', async ({ makeAxeBuilder }) => {
    const results = await makeAxeBuilder().analyze();
    expect(results.violations).toEqual([]);
  })
})
