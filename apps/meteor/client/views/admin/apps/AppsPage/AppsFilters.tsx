import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import FilterByText from '../../../../components/FilterByText';
import CategoryDropDown from '../components/CategoryFilter/CategoryDropDown';
import TagList from '../components/CategoryFilter/TagList';
import RadioDropDown from '../components/RadioDropDown/RadioDropDown';
import type { CategoryDropdownItem, CategoryOnSelected, selectedCategoriesList } from '../definitions/CategoryDropdownDefinitions';
import type { RadioDropDownGroup, RadioDropDownOnSelected } from '../definitions/RadioDropDownDefinitions';

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

	const breakpoints = useBreakpoints();
	const hasFilterStackMargin = !breakpoints.includes('lg') ? '' : 'x8';
	const hasNotFilterStackMargin = !breakpoints.includes('lg') ? 'x8' : '';

	return (
		<>
			<FilterByText
				placeholder={t('Search_Apps')}
				onChange={({ text }): void => setText(text)}
				shouldFiltersStack={!breakpoints.includes('lg')}
			>
				<RadioDropDown group={freePaidFilterStructure} onSelected={freePaidFilterOnSelected} mb={hasNotFilterStackMargin} />
				<RadioDropDown
					group={statusFilterStructure}
					onSelected={statusFilterOnSelected}
					mis={hasFilterStackMargin}
					mbe={hasNotFilterStackMargin}
				/>
				<CategoryDropDown data={categories} selectedCategories={selectedCategories} onSelected={onSelected} />
				<RadioDropDown
					group={sortFilterStructure}
					onSelected={sortFilterOnSelected}
					mis={hasFilterStackMargin}
					mbs={hasNotFilterStackMargin}
				/>
			</FilterByText>
			<TagList categories={categoryTagList} onClick={onSelected} />
		</>
	);
};

export default AppsFilters;
