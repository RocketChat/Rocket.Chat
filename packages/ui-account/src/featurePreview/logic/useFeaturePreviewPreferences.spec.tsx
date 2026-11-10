import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useFeaturePreviewPreferences } from './useFeaturePreviewPreferences';

type SetPreferencesParams = { data: { featuresPreview: { name: string; value: boolean }[] } };

const root = (setPreferences: (params: SetPreferencesParams) => unknown) =>
	mockAppRoot()
		.withJohnDoe()
		.withSetting('Accounts_AllowFeaturePreview', true)
		.withUserPreference('featuresPreview', [])
		.withEndpoint('POST', '/v1/users.setPreferences', setPreferences as never);

it('marks unseen features as seen when opened', async () => {
	const setPreferences = jest.fn((_params: SetPreferencesParams) => ({ user: {} }));
	renderHook(() => useFeaturePreviewPreferences(), { wrapper: root(setPreferences).build() });

	await waitFor(() => expect(setPreferences).toHaveBeenCalledTimes(1));
	expect(setPreferences.mock.calls[0]?.[0].data.featuresPreview.length).toBeGreaterThan(0);
});

it('saves only the name and value of each feature', async () => {
	const setPreferences = jest.fn((_params: SetPreferencesParams) => ({ user: {} }));
	const dispatchToast = jest.fn();
	const { result } = renderHook(() => useFeaturePreviewPreferences(), {
		wrapper: root(setPreferences).withToastMessageDispatch(dispatchToast).build(),
	});

	const [first] = result.current.features;
	if (!first) throw new Error('expected at least one feature');
	await act(() => result.current.save([{ ...first, value: true }]));

	expect(setPreferences).toHaveBeenLastCalledWith({ data: { featuresPreview: [{ name: first.name, value: true }] } });
	expect(dispatchToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
});

it('reports a failed save', async () => {
	const dispatchToast = jest.fn();
	const setPreferences = jest.fn().mockResolvedValueOnce({ user: {} }).mockRejectedValue(new Error('offline'));
	const { result } = renderHook(() => useFeaturePreviewPreferences(), {
		wrapper: root(setPreferences).withToastMessageDispatch(dispatchToast).build(),
	});

	await waitFor(() => expect(setPreferences).toHaveBeenCalledTimes(1));
	await act(() => result.current.save(result.current.features));

	expect(dispatchToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }));
});
