import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import { FilterBar, FilterBarFilters, FilterBarSearch } from '../../../components/FilterBar';
import CategoryDropDown from '../components/CategoryFilter/CategoryDropDown';
import TagList from '../components/CategoryFilter/TagList';
import RadioDropDown from '../components/RadioDropDown/RadioDropDown';
import type { CategoryDropDownListProps, CategoryOnSelected, selectedCategoriesList } from '../definitions/CategoryDropdownDefinitions';
import type { RadioDropDownGroup, RadioDropDownOnSelected } from '../definitions/RadioDropDownDefinitions';

export type AppsFiltersProps = {
	text: string;
	setText: (text: string) => void;
	freePaidFilterStructure: RadioDropDownGroup;
	freePaidFilterOnSelected: RadioDropDownOnSelected;
	categories: CategoryDropDownListProps['categories'];
	selectedCategories: selectedCategoriesList;
	onSelected: CategoryOnSelected;
	sortFilterStructure: RadioDropDownGroup;
	sortFilterOnSelected: RadioDropDownOnSelected;
	categoryTagList: selectedCategoriesList;
	statusFilterStructure: RadioDropDownGroup;
	statusFilterOnSelected: RadioDropDownOnSelected;
	context: string;
};

const AppsFilters = ({
	text,
	setText,
	freePaidFilterStructure,
	freePaidFilterOnSelected,
	categories,
	selectedCategories,
	onSelected,
	sortFilterStructure,
	sortFilterOnSelected,
	categoryTagList,
	statusFilterStructure,
	statusFilterOnSelected,
	context,
}: AppsFiltersProps) => {
	const { t } = useTranslation();

	const isPrivateAppsPage = context === 'private';

	const appsSearchPlaceholders: { [key: string]: string } = {
		explore: t('Search_Apps'),
		enterprise: t('Search_Premium_Apps'),
		installed: t('Search_Installed_Apps'),
		requested: t('Search_Requested_Apps'),
		private: t('Search_Private_apps'),
	};

	return (
		<Box paddingInline={24}>
			<FilterBar>
				<FilterBarSearch value={text} onChange={(event) => setText(event.target.value)} placeholder={appsSearchPlaceholders[context]} />
				<FilterBarFilters>
					{!isPrivateAppsPage && <RadioDropDown group={freePaidFilterStructure} onSelected={freePaidFilterOnSelected} />}
					<RadioDropDown group={statusFilterStructure} onSelected={statusFilterOnSelected} />
					{!isPrivateAppsPage && (
						<CategoryDropDown categories={categories} selectedCategories={selectedCategories} onSelected={onSelected} />
					)}
					<RadioDropDown group={sortFilterStructure} onSelected={sortFilterOnSelected} />
				</FilterBarFilters>
			</FilterBar>
			<TagList categories={categoryTagList} onClick={onSelected} />
		</Box>
	);
};

export default AppsFilters;
