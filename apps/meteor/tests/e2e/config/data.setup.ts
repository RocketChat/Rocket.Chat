import injectInitialData from '../fixtures/inject-initial-data';
import { test, expect } from '../utils/test';

test('inject initial data', async () => {
	const userFixtures = await injectInitialData();
	expect(userFixtures).toBeDefined();
});
