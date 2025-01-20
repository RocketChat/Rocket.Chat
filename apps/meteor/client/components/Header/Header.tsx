import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn, HeaderV2, Header as HeaderComponent } from '@rocket.chat/ui-client';
import type { ComponentProps } from 'react';
import { memo } from 'react';

const Header = (props: ComponentProps<typeof HeaderComponent>) => (
	<FeaturePreview feature='newNavigation'>
		<FeaturePreviewOff>
			<HeaderComponent {...props} />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<HeaderV2 {...props} />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default memo(Header);
