import type { FeaturePreviewProps } from '@rocket.chat/ui-client';
import { useMemo } from 'react';

const handleFeaturePreviewEnableQuery = (item: FeaturePreviewProps, _: any, features: FeaturePreviewProps[]) => {
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
};

const groupFeaturePreview = (features: FeaturePreviewProps[]) =>
	Object.entries(
		features.reduce((result, currentValue) => {
			(result[currentValue.group] = result[currentValue.group] || []).push(currentValue);
			return result;
		}, {} as Record<FeaturePreviewProps['group'], FeaturePreviewProps[]>),
	);

export const useFeaturePreviewEnableQuery = (features: FeaturePreviewProps[]) => {
	return useMemo(() => groupFeaturePreview(features.map(handleFeaturePreviewEnableQuery)), [features]);
};
