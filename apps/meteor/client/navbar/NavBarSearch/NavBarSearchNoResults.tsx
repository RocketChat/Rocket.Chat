import { useTranslation } from 'react-i18next';

import GenericNoResults from '../../components/GenericNoResults';

type NavBarSearchNoResultsProps = {
	suggestAISearch?: boolean;
};

const NavBarSearchNoResults = ({ suggestAISearch = false }: NavBarSearchNoResultsProps) => {
	const { t } = useTranslation();
	return (
		<GenericNoResults
			description={t(suggestAISearch ? 'Try_entering_a_different_search_term_or_enable_AI_Search' : 'Try_entering_a_different_search_term')}
		/>
	);
};

export default NavBarSearchNoResults;
