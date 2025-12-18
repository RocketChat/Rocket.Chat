import { ContextualbarV2Header, ContextualbarHeader as ContextualbarHeaderComponent } from '@rocket.chat/fuselage';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { memo } from 'react';

import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '../FeaturePreview';

type ContextualbarHeaderProps = {
	expanded?: boolean;
	children: ReactNode;
} & ComponentPropsWithoutRef<typeof ContextualbarHeaderComponent>;

const ContextualbarHeader = ({ expanded, ...props }: ContextualbarHeaderProps) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<ContextualbarHeaderComponent height={expanded ? '64px' : '56px'} {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<ContextualbarV2Header mbs={-1} {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(ContextualbarHeader);
