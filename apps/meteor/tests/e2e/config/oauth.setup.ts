import addCustomOAuth from '../fixtures/addCustomOAuth';
import { test, expect } from '../utils/test';

test('add custom oauth', async () => {
	expect((await addCustomOAuth()).status()).toBeDefined();
});
