import { useTranslation } from 'react-i18next';

import GenericNoResults from '../../components/GenericNoResults';

export type NavBarAISearchNoResultsProps = {
	suggestAISearch: boolean;
};

const NavBarAISearchNoResults = ({ suggestAISearch }: NavBarAISearchNoResultsProps) => {
	const { t } = useTranslation();

	return (
		<GenericNoResults
			description={t(suggestAISearch ? 'Try_entering_a_different_search_term_or_search_with_AI' : 'Try_entering_a_different_search_term')}
		/>
	);
};

export default NavBarAISearchNoResults;
