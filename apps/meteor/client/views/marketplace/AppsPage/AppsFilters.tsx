import { Box } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import FilterByText from '../../../components/FilterByText';
import CategoryDropDown from '../components/CategoryFilter/CategoryDropDown';
import TagList from '../components/CategoryFilter/TagList';
import RadioDropDown from '../components/RadioDropDown/RadioDropDown';
import type { CategoryDropDownListProps, CategoryOnSelected, selectedCategoriesList } from '../definitions/CategoryDropdownDefinitions';
import type { RadioDropDownGroup, RadioDropDownOnSelected } from '../definitions/RadioDropDownDefinitions';

type AppsFiltersProps = {
	setText: React.Dispatch<React.SetStateAction<string>> & {
		flush: () => void;
		cancel: () => void;
	};
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
}: AppsFiltersProps): ReactElement => {
	const t = useTranslation();

	const isPrivateAppsPage = context === 'private';

	const shouldFiltersStack = useMediaQuery('(max-width: 1060px)');
	const hasFilterStackMargin = shouldFiltersStack ? '' : 'x8';
	const hasNotFilterStackMargin = shouldFiltersStack ? 'x8' : '';

	return (
		<Box pi='x24'>
			<FilterByText placeholder={t('Search_Apps')} onChange={({ text }): void => setText(text)} shouldFiltersStack={shouldFiltersStack}>
				{!isPrivateAppsPage && (
					<RadioDropDown
						group={freePaidFilterStructure}
						onSelected={freePaidFilterOnSelected}
						mie={hasFilterStackMargin}
						mbs={hasNotFilterStackMargin}
						mbe={hasNotFilterStackMargin}
					/>
				)}
				<RadioDropDown
					group={statusFilterStructure}
					onSelected={statusFilterOnSelected}
					mie={hasFilterStackMargin}
					mbs={shouldFiltersStack && isPrivateAppsPage ? 'x8' : ''}
					mbe={hasNotFilterStackMargin}
				/>
				{!isPrivateAppsPage && (
					<CategoryDropDown
						categories={categories}
						selectedCategories={selectedCategories}
						onSelected={onSelected}
						mie={hasFilterStackMargin}
						mbe={hasNotFilterStackMargin}
					/>
				)}
				<RadioDropDown group={sortFilterStructure} onSelected={sortFilterOnSelected} />
			</FilterByText>
			<TagList categories={categoryTagList} onClick={onSelected} />
		</Box>
	);
};

export default AppsFilters;
