import type { ReactNode } from 'react';

export type FeaturePreviewOnProps = {
	children: ReactNode;
	featureToggleEnabled?: boolean;
};

const FeaturePreviewOff = ({ children, featureToggleEnabled }: FeaturePreviewOnProps) => <>{!featureToggleEnabled && children}</>;

export default FeaturePreviewOff;
