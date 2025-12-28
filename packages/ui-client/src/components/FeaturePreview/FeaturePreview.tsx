import type { ReactElement } from 'react';
import { Children, Suspense, cloneElement } from 'react';

import { useFeaturePreview } from '../../hooks/useFeaturePreview';
import type { FeaturesAvailable } from '../../hooks/useFeaturePreviewList';

export type FeaturePreviewProps = {
	feature: FeaturesAvailable;
	disabled?: boolean;
	children: ReactElement<{ featureToggleEnabled?: boolean }>[];
};

const FeaturePreview = ({ feature, disabled = false, children }: FeaturePreviewProps) => {
	const featureToggleEnabled = useFeaturePreview(feature) && !disabled;

	const toggledChildren = Children.map(children, (child) =>
		cloneElement(child, {
			featureToggleEnabled,
		}),
	);

	return <Suspense fallback={null}>{toggledChildren}</Suspense>;
};

export default FeaturePreview;
