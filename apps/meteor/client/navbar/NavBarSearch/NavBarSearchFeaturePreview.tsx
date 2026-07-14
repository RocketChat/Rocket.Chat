import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';

import NavBarAISearch from './NavBarAISearch';
import NavBarSearch from './NavBarSearch';

const NavBarSearchFeaturePreview = () => (
	<FeaturePreview feature='aiSearch'>
		<FeaturePreviewOff>
			<NavBarSearch />
		</FeaturePreviewOff>
		<FeaturePreviewOn>
			<NavBarAISearch />
		</FeaturePreviewOn>
	</FeaturePreview>
);

export default NavBarSearchFeaturePreview;
