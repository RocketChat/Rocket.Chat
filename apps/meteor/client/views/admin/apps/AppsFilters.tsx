import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import FilterByText from '../../../components/FilterByText';
import CategoryDropDown from './components/CategoryFilter/CategoryDropDown';
import TagList from './components/CategoryFilter/TagList';
import RadioDropDown from './components/RadioDropDown/RadioDropDown';
import { CategoryDropdownItem, CategoryOnSelected, selectedCategoriesList } from './definitions/CategoryDropdownDefinitions';
import { RadioDropDownGroup, RadioDropDownOnSelected } from './definitions/RadioDropDownDefinitions';

type AppsFiltersProps = {
	setText: React.Dispatch<React.SetStateAction<string>> & {
		flush: () => void;
		cancel: () => void;
	};
	freePaidFilterStructure: RadioDropDownGroup;
	freePaidFilterOnSelected: RadioDropDownOnSelected;
	categories: {
		label?: string | undefined;
		items: CategoryDropdownItem[];
	}[];
	selectedCategories: selectedCategoriesList;
	onSelected: CategoryOnSelected;
	sortFilterStructure: RadioDropDownGroup;
	sortFilterOnSelected: RadioDropDownOnSelected;
	categoryTagList: selectedCategoriesList;
	statusFilterStructure: RadioDropDownGroup;
	statusFilterOnSelected: RadioDropDownOnSelected;
};

const AppsFilters = ({
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
}: AppsFiltersProps): ReactElement => {
	const t = useTranslation();

	return (
		<>
			<FilterByText placeholder={t('Search_Apps')} onChange={({ text }): void => setText(text)}>
				<RadioDropDown group={freePaidFilterStructure} onSelected={freePaidFilterOnSelected} mie='x8' />
				<RadioDropDown group={statusFilterStructure} onSelected={statusFilterOnSelected} mie='x8' />
				<CategoryDropDown data={categories} selectedCategories={selectedCategories} onSelected={onSelected} />
				<RadioDropDown group={sortFilterStructure} onSelected={sortFilterOnSelected} mis='x8' />
			</FilterByText>
			<TagList categories={categoryTagList} onClick={onSelected} />
		</>
	);
};

export default AppsFilters;
