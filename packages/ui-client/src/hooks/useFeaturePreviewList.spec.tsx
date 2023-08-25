import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react-hooks';

import { useFeaturePreviewList, enabledDefaultFeatures } from './useFeaturePreviewList';

it('should return the number of unseen features and Accounts_AllowFeaturePreview enabled ', () => {
	const { result } = renderHook(() => useFeaturePreviewList(), {
		wrapper: mockAppRoot().withSetting('Accounts_AllowFeaturePreview', true).build(),
	});

	expect(result.all[0]).toEqual(
		expect.objectContaining({
			featurePreviewEnabled: true,
			unseenFeatures: enabledDefaultFeatures.length,
		}),
	);
});

it('should return the number of unseen features and Accounts_AllowFeaturePreview disabled ', () => {
	const { result } = renderHook(() => useFeaturePreviewList(), {
		wrapper: mockAppRoot().withSetting('Accounts_AllowFeaturePreview', false).build(),
	});

	expect(result.all[0]).toEqual(
		expect.objectContaining({
			featurePreviewEnabled: false,
			unseenFeatures: 0,
		}),
	);
});

it('should return 0 unseen features', () => {
	const { result } = renderHook(() => useFeaturePreviewList(), {
		wrapper: mockAppRoot()
			.withSetting('Accounts_AllowFeaturePreview', true)
			.withUserPreference('featuresPreview', enabledDefaultFeatures)
			.build(),
	});

	expect(result.all[0]).toEqual(
		expect.objectContaining({
			featurePreviewEnabled: true,
			unseenFeatures: 0,
		}),
	);
});

it('should ignore removed feature previews', () => {
	const { result } = renderHook(() => useFeaturePreviewList(), {
		wrapper: mockAppRoot()
			.withSetting('Accounts_AllowFeaturePreview', true)
			.withUserPreference('featuresPreview', [
				{
					name: 'oldFeature',
					value: false,
				},
			])
			.build(),
	});

	expect(result.current).toEqual(
		expect.objectContaining({
			featurePreviewEnabled: true,
			unseenFeatures: enabledDefaultFeatures.length,
			features: enabledDefaultFeatures,
		}),
	);
});

it('should turn off ignored feature previews', async () => {
	const { result } = renderHook(() => useFeaturePreviewList(), {
		wrapper: mockAppRoot()
			.withSetting('Accounts_AllowFeaturePreview', true)
			.withUserPreference('featuresPreview', [
				{
					name: 'oldFeature',
					value: true,
				},
			])
			.build(),
	});

	expect(result.current.features).toEqual(expect.arrayContaining(enabledDefaultFeatures));
});
