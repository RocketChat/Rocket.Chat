import insertApp from '../fixtures/insert-apps';
import { test, expect } from '../utils/test';

test('insert app', async () => {
	expect((await insertApp()).status()).toBeDefined();
});
