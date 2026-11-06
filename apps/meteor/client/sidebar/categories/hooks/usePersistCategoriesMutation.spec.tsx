import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';

import { usePersistCategoriesMutation } from './usePersistCategoriesMutation';

describe('usePersistCategoriesMutation', () => {
	it('reports a rejected write as an error toast', async () => {
		const dispatchToastMessage = jest.fn();
		const rejection = new Error('error-invalid-param');
		const appRoot = mockAppRoot()
			.withEndpoint('POST', '/v1/users.setPreferences', () => {
				throw rejection;
			})
			.withToastMessageDispatch(dispatchToastMessage)
			.build();

		const { result } = renderHook(() => usePersistCategoriesMutation(), { wrapper: appRoot });

		act(() => result.current.mutate([{ _id: 'Design', name: '   ' }]));

		await waitFor(() => expect(dispatchToastMessage).toHaveBeenCalledWith({ type: 'error', message: rejection }));
	});

	it('stays quiet when the write goes through', async () => {
		const dispatchToastMessage = jest.fn();
		const appRoot = mockAppRoot()
			.withEndpoint('POST', '/v1/users.setPreferences', () => ({ user: {} }) as any)
			.withToastMessageDispatch(dispatchToastMessage)
			.build();

		const { result } = renderHook(() => usePersistCategoriesMutation(), { wrapper: appRoot });

		act(() => result.current.mutate([{ _id: 'Design', name: 'Design' }]));

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(dispatchToastMessage).not.toHaveBeenCalled();
	});
});
