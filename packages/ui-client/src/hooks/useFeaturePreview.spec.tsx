import { renderHook } from '@testing-library/react';
import { useFeaturePreview } from './useFeaturePreview';
import { usePreferenceFeaturePreviewList } from './usePreferenceFeaturePreviewList';

jest.mock('./usePreferenceFeaturePreviewList');

const mockUsePreferenceFeaturePreviewList = usePreferenceFeaturePreviewList as jest.Mock;

describe('useFeaturePreview', () => {
	beforeEach(() => {
		mockUsePreferenceFeaturePreviewList.mockReset();
	});

	it('should return false if feature does not exist in the list', () => {
		mockUsePreferenceFeaturePreviewList.mockReturnValue({ features: [] });

		const { result } = renderHook(() => useFeaturePreview('secondarySidebar'));

		expect(result.current).toBe(false);
	});

	it('should return true if feature is enabled and has no special rules', () => {
		mockUsePreferenceFeaturePreviewList.mockReturnValue({
			features: [{ name: 'secondarySidebar', value: true }],
		});

		const { result } = renderHook(() => useFeaturePreview('secondarySidebar'));

		expect(result.current).toBe(true);
	});

	it('should return false if feature is explicitly disabled (logic check)', () => {
		mockUsePreferenceFeaturePreviewList.mockReturnValue({
			features: [{ name: 'secondarySidebar', value: true, disabled: true }],
		});

		const { result } = renderHook(() => useFeaturePreview('secondarySidebar'));

		expect(result.current).toBe(false);
	});

	it('should return false if dependency rule is not met', () => {
		mockUsePreferenceFeaturePreviewList.mockReturnValue({
			features: [
				{
					name: 'secondarySidebar',
					value: true,
					enableQuery: { name: 'newNavigation', value: true },
				},
				{
					name: 'newNavigation',
					value: false,
				},
			],
		});

		const { result } = renderHook(() => useFeaturePreview('secondarySidebar'));

		expect(result.current).toBe(false);
	});

	it('should return true if dependency rule IS met', () => {
		mockUsePreferenceFeaturePreviewList.mockReturnValue({
			features: [
				{
					name: 'secondarySidebar',
					value: true,
					enableQuery: { name: 'newNavigation', value: true },
				},
				{
					name: 'newNavigation',
					value: true,
				},
			],
		});

		const { result } = renderHook(() => useFeaturePreview('secondarySidebar'));

		expect(result.current).toBe(true);
	});
    it('should return false if dependency feature is disabled (even if value matches)', () => {
			mockUsePreferenceFeaturePreviewList.mockReturnValue({
				features: [
					{
						name: 'secondarySidebar',
						value: true,
						enableQuery: { name: 'newNavigation', value: true },
					},
					{
						name: 'newNavigation',
						value: true,
						disabled: true,
					},
				],
			});

			const { result } = renderHook(() => useFeaturePreview('secondarySidebar'));

			expect(result.current).toBe(false);
		});
        it('should return false if the dependency feature is completely missing from the list', () => {
					mockUsePreferenceFeaturePreviewList.mockReturnValue({
						features: [
							{
								name: 'secondarySidebar',
								value: true,
								enableQuery: { name: 'newNavigation', value: true },
							},
						],
					});

					const { result } = renderHook(() => useFeaturePreview('secondarySidebar'));

					expect(result.current).toBe(false);
				});
});
