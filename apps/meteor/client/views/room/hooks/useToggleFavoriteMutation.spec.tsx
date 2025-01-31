import { mockAppRoot } from '@rocket.chat/mock-providers';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';

import { useToggleFavoriteMutation } from './useToggleFavoriteMutation';
import { subscriptionsQueryKeys } from '../../../lib/queryKeys';

it('should work', async () => {
	const endpointHandler = jest.fn(() => null);

	const { result } = renderHook(() => useToggleFavoriteMutation(), {
		wrapper: mockAppRoot().withEndpoint('POST', '/v1/rooms.favorite', endpointHandler).build(),
	});

	result.current.mutate({ roomId: 'general', favorite: true, roomName: 'general' });

	await waitFor(() => expect(result.current.status).toBe('success'));
	expect(endpointHandler).toHaveBeenCalledWith({
		roomId: 'general',
		favorite: true,
	});
});

it('should invalidate any subscription queries', async () => {
	const queryClient = new QueryClient();
	jest.spyOn(queryClient, 'invalidateQueries');

	const { result } = renderHook(() => useToggleFavoriteMutation(), {
		wrapper: mockAppRoot()
			.withEndpoint('POST', '/v1/rooms.favorite', async () => null)
			.wrap((children) => <QueryClientProvider client={queryClient} children={children} />)
			.build(),
	});

	result.current.mutate({ roomId: 'general', favorite: true, roomName: 'general' });

	await waitFor(() => expect(result.current.status).toBe('success'));

	expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: subscriptionsQueryKeys.subscription('general') });
});
