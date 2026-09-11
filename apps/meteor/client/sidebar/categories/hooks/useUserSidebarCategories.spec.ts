import { useUserPreference } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';

import { useUserSidebarCategories } from './useUserSidebarCategories';
import { useHasLicenseModule } from '../../../hooks/useHasLicenseModule';

jest.mock('@rocket.chat/ui-contexts', () => ({
	useUserPreference: jest.fn(),
}));

jest.mock('../../../hooks/useHasLicenseModule', () => ({
	useHasLicenseModule: jest.fn(),
}));

const mockedUseUserPreference = jest.mocked(useUserPreference);
const mockedUseHasLicenseModule = jest.mocked(useHasLicenseModule);

beforeEach(() => {
	mockedUseHasLicenseModule.mockReturnValue({ data: true } as any);
});

const ids = (entries: { _id: string }[]) => entries.map(({ _id }) => _id);

it('returns an empty list when the preference is unset', () => {
	mockedUseUserPreference.mockReturnValue(undefined);

	const { result } = renderHook(() => useUserSidebarCategories());

	expect(result.current.rawCategories).toEqual([]);
	expect(result.current.customCategories).toEqual([]);
});

it('drops entries left behind by a removed system group', () => {
	mockedUseUserPreference.mockReturnValue([
		{ _id: 'Favorites', name: 'Favorites', default: true },
		{ _id: 'Drafts', name: 'Drafts', default: true },
		{ _id: 'Conversations', name: 'Conversations', default: true },
	]);

	const { result } = renderHook(() => useUserSidebarCategories());

	expect(ids(result.current.rawCategories)).toEqual(['Favorites', 'Conversations']);
});

it('keeps custom categories and their stored metadata', () => {
	mockedUseUserPreference.mockReturnValue([
		{ _id: 'Drafts', name: 'Drafts', default: true },
		{ _id: 'custom-xyz', name: 'Work', showUnreads: true },
	]);

	const { result } = renderHook(() => useUserSidebarCategories());

	expect(ids(result.current.rawCategories)).toEqual(['custom-xyz']);
	expect(result.current.customCategories).toEqual([{ _id: 'custom-xyz', name: 'Work', showUnreads: true }]);
});

it('only drops entries flagged as system groups, not custom ids that look like one', () => {
	const entries = [{ _id: 'Favorites', name: 'My favorites' }];
	mockedUseUserPreference.mockReturnValue(entries);

	const { result } = renderHook(() => useUserSidebarCategories());

	expect(result.current.rawCategories).toEqual(entries);
});

it('hides custom categories without the license module but keeps the raw entries', () => {
	mockedUseHasLicenseModule.mockReturnValue({ data: false } as any);
	mockedUseUserPreference.mockReturnValue([
		{ _id: 'Favorites', name: 'Favorites', default: true },
		{ _id: 'Drafts', name: 'Drafts', default: true },
		{ _id: 'custom-xyz', name: 'Work' },
	]);

	const { result } = renderHook(() => useUserSidebarCategories());

	expect(ids(result.current.rawCategories)).toEqual(['Favorites', 'custom-xyz']);
	expect(result.current.customCategories).toEqual([]);
});
