/* eslint-disable react/no-multi-comp */
import type { ReactElement, ReactNode } from 'react';
import React, { Suspense } from 'react';

import { useFeaturePreview } from '../../hooks/useFeaturePreview';
import { FeaturesAvailable } from '../../hooks/useFeaturePreviewList';

export const FeaturePreview = ({ feature, children }: { feature: FeaturesAvailable; children: ReactElement[] }) => {
	const featureToggleEnabled = useFeaturePreview(feature);

	const toggledChildren = React.Children.map(children, (child) =>
		React.cloneElement(child, {
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
