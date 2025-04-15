import { NavBarGroup, NavBarSection, NavBarItem } from '@rocket.chat/fuselage';
import { useRouter } from '@rocket.chat/ui-contexts';
import { FocusScope } from 'react-aria';
import { useTranslation } from 'react-i18next';

import NavBarSearch from './NavBarSearch';

const NavbarNavigation = () => {
	const { t } = useTranslation();
	const { navigate } = useRouter();

	return (
		<NavBarSection>
			<FocusScope>
				<NavBarSearch />
			</FocusScope>
			<NavBarGroup>
				<NavBarItem title={t('Back')} onClick={() => navigate(-1)} icon='chevron-right' small />
				<NavBarItem title={t('Forward')} onClick={() => navigate(1)} icon='chevron-left' small />
			</NavBarGroup>
		</NavBarSection>
	);
};

export default NavbarNavigation;
