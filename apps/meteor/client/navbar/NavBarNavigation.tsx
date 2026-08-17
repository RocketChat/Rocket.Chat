import { FocusScope } from '@react-aria/focus';
import { NavBarGroup, NavBarItem, Box } from '@rocket.chat/fuselage';
import { FeaturePreview, FeaturePreviewOff, FeaturePreviewOn } from '@rocket.chat/ui-client';
import { useLayout, useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import NavBarSearch from './NavBarSearch';
import NavBarAISearch from './NavBarSearch/NavBarAISearch';

const NavbarNavigation = () => {
	const { t } = useTranslation();
	const { navigate } = useRouter();
	const { isMobile } = useLayout();

	return (
		<Box display='flex' flexGrow={1} justifyContent='center'>
			<FocusScope>
				<FeaturePreview feature='aiSearch'>
					<FeaturePreviewOff>
						<NavBarSearch />
					</FeaturePreviewOff>
					<FeaturePreviewOn>
						<NavBarAISearch />
					</FeaturePreviewOn>
				</FeaturePreview>
			</FocusScope>
			{!isMobile && (
				<Box marginInlineEnd={8}>
					<NavBarGroup aria-label={t('History_navigation')}>
						<NavBarItem title={t('Back_in_history')} onClick={() => navigate(-1)} icon='chevron-right' small />
						<NavBarItem title={t('Forward_in_history')} onClick={() => navigate(1)} icon='chevron-left' small />
					</NavBarGroup>
				</Box>
			)}
		</Box>
	);
};

export default NavbarNavigation;
