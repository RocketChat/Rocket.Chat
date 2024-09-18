import type { FeaturePreviewProps } from '@rocket.chat/ui-client';

export const useFeaturePreviewEnableQuery = (features: FeaturePreviewProps[]) => {
	return Object.entries(
		features
			.map((item) => {
				if (item.enableQuery) {
					const expected = item.enableQuery.value;
					const received = features.find((el) => el.name === item.enableQuery?.name)?.value;
					if (expected !== received) {
						item.disabled = true;
						item.value = false;
					} else {
						item.disabled = false;
					}
				}
				return item;
			})
			.reduce((result, currentValue) => {
				(result[currentValue.group] = result[currentValue.group] || []).push(currentValue);
				return result;
			}, {} as Record<FeaturePreviewProps['group'], FeaturePreviewProps[]>),
	);
};
