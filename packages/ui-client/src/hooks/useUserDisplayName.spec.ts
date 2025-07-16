import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import { useUserDisplayName } from './useUserDisplayName';

const fakeUser = {
	name: 'John Doe',
	username: 'john.doe',
};

it('should return username if UI_Use_Real_Name setting is false', () => {
	const { result } = renderHook(() => useUserDisplayName(fakeUser), {
		legacyRoot: true,
		wrapper: mockAppRoot().withSetting('UI_Use_Real_Name', false).build(),
	});

	expect(result.current).toBe(fakeUser.username);
});

it('should return name if UI_Use_Real_Name setting is true', () => {
	const { result } = renderHook(() => useUserDisplayName(fakeUser), {
		legacyRoot: true,
		wrapper: mockAppRoot().withSetting('UI_Use_Real_Name', true).build(),
	});

	expect(result.current).toBe(fakeUser.name);
});

it('should return username if UI_Use_Real_Name setting is true and user has no name', () => {
	const { result } = renderHook(() => useUserDisplayName({ ...fakeUser, name: undefined }), {
		legacyRoot: true,
		wrapper: mockAppRoot().withSetting('UI_Use_Real_Name', true).build(),
	});

	expect(result.current).toBe(fakeUser.username);
});
