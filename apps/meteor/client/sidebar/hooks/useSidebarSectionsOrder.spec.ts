import { SIDEBAR_SYSTEM_GROUP_KEYS } from '@rocket.chat/core-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';

import { useSidebarSectionsOrder } from './useSidebarSectionsOrder';

jest.mock('@rocket.chat/ui-contexts', () => ({
	useUserPreference: jest.fn(),
}));

const mockedUseUserPreference = jest.mocked(useUserPreference);

it('falls back to the system group keys when the preference is unset', () => {
	mockedUseUserPreference.mockReturnValue(undefined);

	const { result } = renderHook(() => useSidebarSectionsOrder());

	expect(result.current).toEqual(SIDEBAR_SYSTEM_GROUP_KEYS);
});

it('drops keys of system groups that no longer exist', () => {
	mockedUseUserPreference.mockReturnValue(['Unread', 'Drafts', 'Favorites', 'Conversations']);

	const { result } = renderHook(() => useSidebarSectionsOrder());

	expect(result.current).toEqual(['Unread', 'Favorites', 'Conversations']);
});

it('keeps the stored order of the remaining keys', () => {
	mockedUseUserPreference.mockReturnValue(['Conversations', 'Drafts', 'Favorites', 'Unread']);

	const { result } = renderHook(() => useSidebarSectionsOrder());

	expect(result.current).toEqual(['Conversations', 'Favorites', 'Unread']);
});

it('does not treat custom category ids as section keys', () => {
	mockedUseUserPreference.mockReturnValue(['Favorites', 'custom-xyz']);

	const { result } = renderHook(() => useSidebarSectionsOrder());

	expect(result.current).toEqual(['Favorites']);
});

it('returns an empty list when every stored key is stale', () => {
	mockedUseUserPreference.mockReturnValue(['Drafts']);

	const { result } = renderHook(() => useSidebarSectionsOrder());

	expect(result.current).toEqual([]);
});
