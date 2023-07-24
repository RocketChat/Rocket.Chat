import { renderHook } from '@testing-library/react-hooks';

import { MockedSettingsContext, MockedUserContext } from './useFeaturePreview.spec';
import { useFeaturePreviewList, defaultFeaturesPreview } from './useFeaturePreviewList';

it('should return the number of unseen features and Accounts_AllowFeaturePreview enabled ', () => {
	const { result } = renderHook(() => useFeaturePreviewList(), {
		wrapper: ({ children }) => (
			<MockedSettingsContext
				settings={{
					Accounts_AllowFeaturePreview: true,
				}}
			>
				<MockedUserContext userPreferences={{}}>{children}</MockedUserContext>
			</MockedSettingsContext>
		),
	});

	expect(result.all[0]).toEqual(
		expect.objectContaining({
			featurePreviewEnabled: true,
			unseenFeatures: defaultFeaturesPreview.length,
		}),
	);
});

it('should return the number of unseen features and Accounts_AllowFeaturePreview disabled ', () => {
	const { result } = renderHook(() => useFeaturePreviewList(), {
		wrapper: ({ children }) => (
			<MockedSettingsContext
				settings={{
					Accounts_AllowFeaturePreview: false,
				}}
			>
				<MockedUserContext userPreferences={{}}>{children}</MockedUserContext>
			</MockedSettingsContext>
		),
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
		wrapper: ({ children }) => (
			<MockedSettingsContext
				settings={{
					Accounts_AllowFeaturePreview: true,
				}}
			>
				<MockedUserContext
					userPreferences={{
						featuresPreview: defaultFeaturesPreview,
					}}
				>
					{children}
				</MockedUserContext>
			</MockedSettingsContext>
		),
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
		wrapper: ({ children }) => (
			<MockedSettingsContext
				settings={{
					Accounts_AllowFeaturePreview: true,
				}}
			>
				<MockedUserContext
					userPreferences={{
						featuresPreview: [
							{
								name: 'oldFeature',
								value: false,
							},
						],
					}}
				>
					{children}
				</MockedUserContext>
			</MockedSettingsContext>
		),
	});

	expect(result.current).toEqual(
		expect.objectContaining({
			featurePreviewEnabled: true,
			unseenFeatures: defaultFeaturesPreview.length,
			features: defaultFeaturesPreview,
		}),
	);
});
