import { useTranslation } from 'react-i18next';

import GenericNoResults from '../../components/GenericNoResults';

const NavBarSearchNoResults = () => {
	const { t } = useTranslation();
	return <GenericNoResults description={t('Try_entering_a_different_search_term')} />;
};

export default NavBarSearchNoResults;
