import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';

import { usePersonalAccessTokens } from './usePersonalAccessTokens';

const tokens = [{ name: 'ci', createdAt: '2026-01-01T00:00:00.000Z', lastTokenPart: 'abc123', bypassTwoFactor: false }];

const root = () =>
	mockAppRoot()
		.withJohnDoe()
		.withEndpoint('GET', '/v1/users.getPersonalAccessTokens', () => ({ tokens }));

it('exposes the loaded tokens', async () => {
	const { result } = renderHook(() => usePersonalAccessTokens(), { wrapper: root().build() });

	expect(result.current.status).toBe('loading');
	await waitFor(() => expect(result.current.status).toBe('ready'));
	expect(result.current.tokens).toEqual(tokens);
});

it('asks for confirmation before regenerating and then shows the new token', async () => {
	const regenerate = jest.fn(() => ({ token: 'new-token' }));
	const { result } = renderHook(() => usePersonalAccessTokens(), {
		wrapper: root().withEndpoint('POST', '/v1/users.regeneratePersonalAccessToken', regenerate).build(),
	});

	act(() => result.current.requestRegenerate('ci'));
	expect(result.current.dialog).toEqual({ type: 'confirm-regenerate', tokenName: 'ci' });
	expect(regenerate).not.toHaveBeenCalled();

	await act(() => result.current.confirmDialog());
	expect(regenerate).toHaveBeenCalledWith({ tokenName: 'ci' });
	expect(result.current.dialog).toEqual({ type: 'token-generated', token: 'new-token' });
});

it('removes a token after confirmation', async () => {
	const remove = jest.fn(() => null);
	const dispatchToast = jest.fn();
	const { result } = renderHook(() => usePersonalAccessTokens(), {
		wrapper: root().withEndpoint('POST', '/v1/users.removePersonalAccessToken', remove).withToastMessageDispatch(dispatchToast).build(),
	});

	act(() => result.current.requestRemove('ci'));
	await act(() => result.current.confirmDialog());

	expect(remove).toHaveBeenCalledWith({ tokenName: 'ci' });
	expect(dispatchToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
	expect(result.current.dialog).toBeNull();
});

it('reports a failed creation and keeps the form data', async () => {
	const dispatchToast = jest.fn();
	const { result } = renderHook(() => usePersonalAccessTokens(), {
		wrapper: root()
			.withEndpoint('POST', '/v1/users.generatePersonalAccessToken', () => {
				throw new Error('duplicated');
			})
			.withToastMessageDispatch(dispatchToast)
			.build(),
	});

	let created: boolean | undefined;
	await act(async () => {
		created = await result.current.create({ tokenName: 'ci', bypassTwoFactor: false });
	});

	expect(created).toBe(false);
	expect(dispatchToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
	expect(result.current.dialog).toBeNull();
});
