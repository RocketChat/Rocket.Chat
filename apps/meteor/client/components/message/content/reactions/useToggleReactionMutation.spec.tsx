import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, act } from '@testing-library/react-hooks';

import { useToggleReactionMutation } from './useToggleReactionMutation';

it('should be call rest `POST /v1/chat.react` method', async () => {
	const fn = jest.fn();

	const { result, waitFor } = renderHook(() => useToggleReactionMutation(), {
		wrapper: mockAppRoot().withEndpoint('POST', '/v1/chat.react', fn).withJohnDoe().build(),
	});

	await act(async () => {
		await result.current.mutateAsync({ mid: 'MID', reaction: 'smile' });
	});

	await waitFor(() => result.current.isLoading === false);

	expect(fn).toHaveBeenCalledWith({
		messageId: 'MID',
		reaction: 'smile',
	});
});

it('should not work for non-logged in users', async () => {
	const fn = jest.fn();

	const { result } = renderHook(() => useToggleReactionMutation(), {
		wrapper: mockAppRoot().withEndpoint('POST', '/v1/chat.react', fn).build(),
	});

	await act(async () => {
		expect(result.current.mutateAsync({ mid: 'MID', reaction: 'smile' })).rejects.toThrowError();
	});

	expect(fn).not.toHaveBeenCalled();

	expect(result.current.status).toBe('error');
	expect(result.current.error).toEqual(new Error('Not logged in'));
});
