import { Users } from './fixtures/userStates';
import { test, expect } from './utils/test';

// We mock the REST `method.call` response instead of registering a real
// Meteor method that requires 2FA: there isn't one in the codebase right now
// (every twoFactorRequired/`requireSecondFactor: true` user-facing surface is
// a typed REST endpoint), and the bug we're guarding against lives inside
// `ddpOverREST`'s `.catch` — a unit-style server fixture exercises it more
// reliably than wiring up TOTP for a real account.
test.use({ storageState: Users.admin.state });

const METHOD_NAME = 'rc-test-totp-flow';

test.describe('account-totp ddpOverREST preserves the totp-required error', () => {
	test('opens the TOTP modal when the REST envelope carries a `totp-required` DDP frame, and resolves on retry', async ({ page }) => {
		await page.goto('/home');
		await expect(page.getByRole('main')).toBeVisible();

		let calls = 0;
		await page.route(`**/api/v1/method.call/${METHOD_NAME}`, async (route) => {
			calls += 1;
			const body = JSON.parse(route.request().postData() ?? '{}');
			const message = JSON.parse(body.message);
			const lastParam = message.params[message.params.length - 1];
			const hasTotp = lastParam && typeof lastParam === 'object' && lastParam.twoFactorCode && lastParam.twoFactorMethod === 'totp';

			if (!hasTotp) {
				// First leg: server demands a TOTP code. The body is shaped exactly
				// like `mountResult({ id, error })` in app/api/server/v1/misc.ts —
				// `message` is a DDP-encoded `result` frame whose `error.error`
				// carries the original `totp-required` code. The bug under test
				// rebuilt this envelope as `error: 'unknown'` and the 2FA modal
				// never opened.
				await route.fulfill({
					status: 400,
					contentType: 'application/json',
					body: JSON.stringify({
						success: false,
						message: JSON.stringify({
							msg: 'result',
							id: message.id,
							error: {
								isClientSafe: true,
								error: 'totp-required',
								reason: 'TOTP Required',
								message: 'TOTP Required [totp-required]',
								errorType: 'Meteor.Error',
								details: { method: 'totp', availableMethods: ['totp'] },
							},
						}),
					}),
				});
				return;
			}

			// Second leg: client retried with the code; respond success.
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					message: JSON.stringify({
						msg: 'result',
						id: message.id,
						result: { ok: true, code: lastParam.twoFactorCode },
					}),
				}),
			});
		});

		// Drive the call from the page so it goes through Meteor.callAsync →
		// withAsyncTOTP → ddpOverREST → process2faAsyncReturn — the exact path
		// where the catch handler used to drop `error: 'totp-required'` and the
		// TOTP modal therefore never opened.
		await page.evaluate((method) => {
			(window as any).__totpCallResult = (window as any).Meteor.callAsync(method)
				.then((value: unknown) => ({ ok: true, value }))
				.catch((err: unknown) => ({ ok: false, error: String((err as Error)?.message ?? err) }));
		}, METHOD_NAME);

		const totpModal = page.getByRole('dialog', { name: 'Enter TOTP password' });
		await expect(totpModal).toBeVisible({ timeout: 10_000 });

		await totpModal.getByPlaceholder('Enter code here').fill('123456');
		await totpModal.getByRole('button', { name: 'Verify' }).click();

		await expect(totpModal).toBeHidden();

		const result = await page.evaluate(() => (window as any).__totpCallResult);
		expect(result).toEqual({ ok: true, value: { ok: true, code: '123456' } });
		expect(calls).toBe(2);
	});
});
