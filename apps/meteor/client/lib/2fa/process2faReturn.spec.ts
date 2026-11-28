import { imperativeModal } from '@rocket.chat/ui-client';
import { waitFor } from '@testing-library/react';

import { process2faAsyncReturn, process2faReturn } from './process2faReturn';

jest.mock('@rocket.chat/ui-client', () => ({ imperativeModal: { open: jest.fn(), close: jest.fn() } }));

const totpRequired = (details: Record<string, unknown>) =>
	Object.assign(new Error('TOTP Required'), { error: 'totp-required', details: { method: 'email', ...details } });

const openedModalProps = async () => {
	await waitFor(() => expect(imperativeModal.open).toHaveBeenCalled());
	return jest.mocked(imperativeModal.open).mock.calls[0][0].props;
};

beforeEach(() => {
	jest.mocked(imperativeModal.open).mockReset();
	jest.mocked(imperativeModal.close).mockReset();
});

it('opens the email code modal with the login challenge when the server sent one', async () => {
	void process2faReturn({
		error: totpRequired({ emailOrUsername: 'john', challengeId: 'challenge-1' }),
		result: undefined,
		originalCallback: undefined,
		onCode: jest.fn(),
		emailOrUsername: 'john',
	});

	const props = await openedModalProps();
	expect(props).toMatchObject({ method: 'email', challengeId: 'challenge-1' });
	expect(props).not.toHaveProperty('emailOrUsername');
});

it('opens the email code modal with the username when the server sent no challenge', async () => {
	void process2faReturn({
		error: totpRequired({ emailOrUsername: 'john' }),
		result: undefined,
		originalCallback: undefined,
		onCode: jest.fn(),
		emailOrUsername: 'john',
	});

	const props = await openedModalProps();
	expect(props).toMatchObject({ method: 'email', emailOrUsername: 'john' });
	expect(props).not.toHaveProperty('challengeId');
});

it('opens the email code modal with the login challenge for logins that go through the async flow', async () => {
	void process2faAsyncReturn({
		error: totpRequired({ emailOrUsername: 'john', challengeId: 'challenge-1' }),
		onCode: jest.fn(),
		emailOrUsername: 'john',
	});

	const props = await openedModalProps();
	expect(props).toMatchObject({ method: 'email', challengeId: 'challenge-1' });
	expect(props).not.toHaveProperty('emailOrUsername');
});

it('opens the email code modal with the username in the async flow when the server sent no challenge', async () => {
	void process2faAsyncReturn({
		error: totpRequired({ emailOrUsername: 'john' }),
		onCode: jest.fn(),
		emailOrUsername: 'john',
	});

	const props = await openedModalProps();
	expect(props).toMatchObject({ method: 'email', emailOrUsername: 'john' });
	expect(props).not.toHaveProperty('challengeId');
});

it('sends the hash of the password, not the password, to the call that asked for it', async () => {
	const onCode = jest.fn().mockResolvedValue('result');
	const result = process2faAsyncReturn({ error: totpRequired({ method: 'password' }), onCode, emailOrUsername: 'john' });

	await (await openedModalProps())?.onConfirm('secret', 'password');

	expect(onCode).toHaveBeenCalledWith('2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b', 'password');
	await expect(result).resolves.toBe('result');
});

it('sends the authenticator code as typed to the call that asked for it', async () => {
	const onCode = jest.fn().mockResolvedValue('result');
	const result = process2faAsyncReturn({ error: totpRequired({ method: 'totp' }), onCode, emailOrUsername: 'john' });

	await (await openedModalProps())?.onConfirm('123456', 'totp');

	expect(onCode).toHaveBeenCalledWith('123456', 'totp');
	await expect(result).resolves.toBe('result');
});

it('keeps the prompt open and lets it show the error when the call refuses the code', async () => {
	const result = process2faAsyncReturn({
		error: totpRequired({ method: 'totp' }),
		onCode: jest.fn().mockRejectedValue(new Error('totp-invalid')),
		emailOrUsername: 'john',
	});
	const settled = jest.fn();
	void result.then(settled, settled);

	await expect((await openedModalProps())?.onConfirm('000000', 'totp')).rejects.toThrow('totp-invalid');

	expect(imperativeModal.close).not.toHaveBeenCalled();
	expect(settled).not.toHaveBeenCalled();
});
