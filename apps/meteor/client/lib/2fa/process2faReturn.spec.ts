import { imperativeModal } from '@rocket.chat/ui-client';
import { waitFor } from '@testing-library/react';

import { process2faAsyncReturn, process2faReturn } from './process2faReturn';

jest.mock('@rocket.chat/ui-client', () => ({ imperativeModal: { open: jest.fn() } }));

const totpRequired = (details: Record<string, unknown>) =>
	Object.assign(new Error('TOTP Required'), { error: 'totp-required', details: { method: 'email', ...details } });

const openedModalProps = async () => {
	await waitFor(() => expect(imperativeModal.open).toHaveBeenCalled());
	return jest.mocked(imperativeModal.open).mock.calls[0][0].props;
};

beforeEach(() => {
	jest.mocked(imperativeModal.open).mockReset();
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
