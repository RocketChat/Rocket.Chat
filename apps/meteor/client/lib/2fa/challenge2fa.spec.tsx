import { mockAppRoot } from '@rocket.chat/mock-providers';
import { SHA256 } from '@rocket.chat/sha256';
import { ModalProvider, ModalRegion } from '@rocket.chat/ui-client';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Suspense, type ReactNode } from 'react';

import { challenge2fa } from './challenge2fa';

// ── Error factories ──────────────────────────────────────────────────────────

const totpRequired = (method: 'totp' | 'email' | 'password', emailOrUsername?: string) => ({
	errorType: 'totp-required' as const,
	details: { method, ...(emailOrUsername && { emailOrUsername }) },
});

const totpInvalid = (method: 'totp' | 'email' | 'password', emailOrUsername?: string) => ({
	errorType: 'totp-invalid' as const,
	details: { method, ...(emailOrUsername && { emailOrUsername }) },
});

const totpMaxAttempts = (method: 'totp' | 'email' | 'password') => ({
	errorType: 'totp-max-attempts' as const,
	details: { method },
});

// ── Wrapper ──────────────────────────────────────────────────────────────────

const withModalProvider = (children: ReactNode) => (
	<Suspense fallback={null}>
		<ModalProvider>
			<ModalRegion />
			{children}
		</ModalProvider>
	</Suspense>
);

const Wrapper = mockAppRoot().wrap(withModalProvider).build();

const setup = () => render(<></>, { wrapper: Wrapper });

// ── Parametrized method configurations ──────────────────────────────────────

const twoFactorMethods = [
	{
		method: 'totp',
		error: totpRequired('totp'),
		invalidError: totpInvalid('totp'),
		title: 'Enter_TOTP_password',
		inputPlaceholder: 'Enter_code_here',
		inlineError: 'Invalid_two_factor_code',
		sampleCode: '654321',
		expectedCode: '654321',
	},
	{
		method: 'email',
		error: totpRequired('email', 'user@example.com'),
		invalidError: totpInvalid('email', 'user@example.com'),
		title: 'Enter_authentication_code',
		inputPlaceholder: 'Enter_code_here',
		inlineError: 'Invalid_two_factor_code',
		sampleCode: '112233',
		expectedCode: '112233',
	},
	{
		method: 'password',
		error: totpRequired('password'),
		invalidError: totpInvalid('password'),
		title: 'Please_enter_your_password',
		inputPlaceholder: 'Password',
		inlineError: 'Invalid_password',
		sampleCode: 'mypassword',
		expectedCode: SHA256('mypassword'),
	},
] as const;

// ── Tests ────────────────────────────────────────────────────────────────────

describe('challenge2fa', () => {
	describe('error handling', () => {
		it('throws non-2FA errors without opening a modal', () => {
			setup();
			const error = new Error('unexpected error');

			act(() => {
				expect(() => challenge2fa({ error })).toThrow(error);
			});
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		it('throws max-attempts errors without opening a modal', () => {
			setup();

			act(() => {
				expect(() => challenge2fa({ error: totpMaxAttempts('totp') })).toThrow();
			});
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		it('closes an open challenge and throws when a non-2FA error arrives', async () => {
			setup();

			act(() => {
				challenge2fa({ error: totpRequired('totp') });
			});

			expect(await screen.findByRole('dialog')).toBeInTheDocument();
			await userEvent.type(screen.getByRole('textbox'), '123');
			await userEvent.click(screen.getByRole('button', { name: 'Verify' }));

			act(() => {
				expect(() => challenge2fa({ error: new Error('non-2FA error') })).toThrow();
			});
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		it('closes an open challenge and throws when a max-attempts error arrives', async () => {
			setup();

			act(() => {
				challenge2fa({ error: totpRequired('totp') });
			});

			expect(await screen.findByRole('dialog')).toBeInTheDocument();
			await userEvent.type(screen.getByRole('textbox'), '123');
			await userEvent.click(screen.getByRole('button', { name: 'Verify' }));

			act(() => {
				expect(() => challenge2fa({ error: totpMaxAttempts('totp') })).toThrow();
			});
			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});
	});

	describe.each(twoFactorMethods)(
		'$method method',
		({ error, invalidError, title, inputPlaceholder, inlineError, sampleCode, expectedCode }) => {
			it('opens a verification dialog', async () => {
				setup();

				let result: ReturnType<typeof challenge2fa>;
				act(() => {
					result = challenge2fa({ error });
				});
				const [code] = result!;

				expect(await screen.findByRole('dialog')).toBeInTheDocument();
				expect(screen.getByText(title)).toBeInTheDocument();

				await Promise.all([
					userEvent.click(screen.getByRole('button', { name: 'Cancel' })),
					expect(code).rejects.toThrow('Two-factor_authentication_cancelled'),
				]);
			});

			it('resolves the code promise with the expected code when confirmed', async () => {
				setup();

				let result: ReturnType<typeof challenge2fa>;
				act(() => {
					result = challenge2fa({ error });
				});
				const [code, resolveChallenge] = result!;

				expect(await screen.findByRole('dialog')).toBeInTheDocument();
				await userEvent.type(screen.getByPlaceholderText(inputPlaceholder), sampleCode);
				await userEvent.click(screen.getByRole('button', { name: 'Verify' }));
				act(() => resolveChallenge());

				await expect(code).resolves.toBe(expectedCode);
			});

			it('rejects the code promise when the dialog is cancelled', async () => {
				setup();

				let result: ReturnType<typeof challenge2fa>;
				act(() => {
					result = challenge2fa({ error });
				});
				const [code] = result!;

				expect(await screen.findByRole('dialog')).toBeInTheDocument();
				await Promise.all([
					userEvent.click(screen.getByRole('button', { name: 'Cancel' })),
					expect(code).rejects.toThrow('Two-factor_authentication_cancelled'),
				]);
			});

			it('rejects the code promise when the dialog is closed via the X button', async () => {
				setup();

				let result: ReturnType<typeof challenge2fa>;
				act(() => {
					result = challenge2fa({ error });
				});
				const [code] = result!;

				expect(await screen.findByRole('dialog')).toBeInTheDocument();
				await Promise.all([
					userEvent.click(screen.getByRole('button', { name: 'Cancel' })),
					expect(code).rejects.toThrow('Two-factor_authentication_cancelled'),
				]);
			});

			it('shows an inline error and keeps the dialog open when an invalid code retry is received', async () => {
				setup();

				act(() => {
					challenge2fa({ error });
				});

				expect(await screen.findByRole('dialog')).toBeInTheDocument();
				await userEvent.type(screen.getByPlaceholderText(inputPlaceholder), 'wrongcode');
				await userEvent.click(screen.getByRole('button', { name: 'Verify' }));

				let retryResult: ReturnType<typeof challenge2fa>;
				act(() => {
					retryResult = challenge2fa({ error: invalidError });
				});

				expect(await screen.findByText(inlineError)).toBeInTheDocument();
				expect(screen.getByRole('dialog')).toBeInTheDocument();

				await Promise.all([
					userEvent.click(screen.getByRole('button', { name: 'Cancel' })),
					expect(retryResult![0]).rejects.toThrow('Two-factor_authentication_cancelled'),
				]);
			});
		},
	);

	describe('password method - SHA256 encoding', () => {
		it('resolves with the SHA256 hash of the entered password, not the plaintext', async () => {
			setup();

			const plainPassword = 'verifypassword';
			let result: ReturnType<typeof challenge2fa>;
			act(() => {
				result = challenge2fa({ error: totpRequired('password') });
			});
			const [code, resolveChallenge] = result!;

			expect(await screen.findByRole('dialog')).toBeInTheDocument();
			await userEvent.type(screen.getByPlaceholderText('Password'), plainPassword);
			await userEvent.click(screen.getByRole('button', { name: 'Verify' }));
			act(() => resolveChallenge());

			const resolvedCode = await code;
			expect(resolvedCode).toBe(SHA256(plainPassword));
			expect(resolvedCode).not.toBe(plainPassword);
		});
	});
});
