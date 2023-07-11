import { FeaturePreview, FeaturePreviewOn, FeaturePreviewOff } from '@rocket.chat/ui-client';
import type { ReactElement } from 'react';
import React, { lazy, memo } from 'react';

const Header = lazy(() => import('./Header'));
const HeaderPreview = lazy(() => import('./HeaderPreview'));

const HeaderWrapper = (): ReactElement => {
	return (
		<FeaturePreview feature='navigationBar'>
			<FeaturePreviewOff>
				<Header />
			</FeaturePreviewOff>
			<FeaturePreviewOn>
				<HeaderPreview />
			</FeaturePreviewOn>
		</FeaturePreview>
	);
};

export default memo(HeaderWrapper);
