import { test, expect } from '@playwright/test';

test.describe('test', () => {
	test('expect 1 to be equal 1', () => {
		expect(1).toBe(1);
	});
});
