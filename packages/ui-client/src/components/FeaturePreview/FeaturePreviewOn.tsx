import type { ReactNode } from 'react';

export type FeaturePreviewOnProps = {
	children: ReactNode;
	featureToggleEnabled?: boolean;
};

const FeaturePreviewOn = ({ children, featureToggleEnabled }: FeaturePreviewOnProps) => <>{featureToggleEnabled && children}</>;

export default FeaturePreviewOn;
