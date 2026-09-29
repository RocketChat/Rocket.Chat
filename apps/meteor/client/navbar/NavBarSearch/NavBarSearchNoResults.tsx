import { GenericNoResults } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

const NavBarSearchNoResults = () => {
	const { t } = useTranslation();
	return <GenericNoResults description={t('Try_entering_a_different_search_term')} />;
};

export default NavBarSearchNoResults;
