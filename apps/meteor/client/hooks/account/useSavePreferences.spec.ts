import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useSavePreferences } from './useSavePreferences';
import type { AccountPreferencesData } from '../../views/account/preferences/useAccountPreferencesValues';

const mockSetPreferencesEndpoint = jest.fn();

describe('useSavePreferences', () => {
	it('should call setPreferencesEndpoint with correct data', async () => {
		const dirtyFields = { language: true };
		const { result } = renderHook(() => useSavePreferences({ dirtyFields }), {
			wrapper: mockAppRoot().withEndpoint('POST', '/v1/users.setPreferences', mockSetPreferencesEndpoint).build(),
		});

		const formData: AccountPreferencesData = { language: 'en' };
		await waitFor(() => result.current(formData));

		expect(mockSetPreferencesEndpoint).toHaveBeenCalledTimes(1);
	});
});
