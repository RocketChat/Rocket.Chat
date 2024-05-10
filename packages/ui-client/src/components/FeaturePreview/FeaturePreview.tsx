/* eslint-disable react/no-multi-comp */
import type { ReactElement, ReactNode } from 'react';
import { Children, Suspense, cloneElement } from 'react';

import { useFeaturePreview } from '../../hooks/useFeaturePreview';
import { FeaturesAvailable } from '../../hooks/useFeaturePreviewList';

export const FeaturePreview = ({ feature, children }: { feature: FeaturesAvailable; children: ReactElement[] }) => {
	const featureToggleEnabled = useFeaturePreview(feature);

	const toggledChildren = Children.map(children, (child) =>
		cloneElement(child, {
			featureToggleEnabled,
		}),
	);

	return <Suspense fallback={null}>{toggledChildren}</Suspense>;
};

export const FeaturePreviewOn = ({ children, featureToggleEnabled }: { children: ReactNode; featureToggleEnabled?: boolean }) => (
	<>{featureToggleEnabled && children}</>
);

export const FeaturePreviewOff = ({ children, featureToggleEnabled }: { children: ReactNode; featureToggleEnabled?: boolean }) => (
	<>{!featureToggleEnabled && children}</>
);
