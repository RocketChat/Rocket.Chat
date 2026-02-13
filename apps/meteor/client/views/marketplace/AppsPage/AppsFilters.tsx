import { Box } from '@rocket.chat/fuselage';
import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import FilterByText from '../../../components/FilterByText';
import CategoryDropDown from '../components/CategoryFilter/CategoryDropDown';
import TagList from '../components/CategoryFilter/TagList';
import RadioDropDown from '../components/RadioDropDown/RadioDropDown';
import type { CategoryDropDownListProps, CategoryOnSelected, selectedCategoriesList } from '../definitions/CategoryDropdownDefinitions';
import type { RadioDropDownGroup, RadioDropDownOnSelected } from '../definitions/RadioDropDownDefinitions';

type AppsFiltersProps = {
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
}: AppsFiltersProps): ReactElement => {
	const { t } = useTranslation();

	const isPrivateAppsPage = context === 'private';
	const breakpoints = useBreakpoints();
	const isMobile = !breakpoints.includes('sm');

	const appsSearchPlaceholders: { [key: string]: string } = {
		explore: t('Search_Apps'),
		enterprise: t('Search_Premium_Apps'),
		installed: t('Search_Installed_Apps'),
		requested: t('Search_Requested_Apps'),
		private: t('Search_Private_apps'),
	};

	// Responsive filter sizing: full width on mobile, fixed width on desktop
	const fixFiltersSize = isMobile 
		? { minWidth: 'x100', flexGrow: 1 } 
		: { maxWidth: 'x200', minWidth: 'x200' };

	return (
		<Box pi={24} position='relative' zIndex={1}>
			<FilterByText value={text} onChange={(event) => setText(event.target.value)} placeholder={appsSearchPlaceholders[context]}>
				{!isPrivateAppsPage && (
					<RadioDropDown group={freePaidFilterStructure} onSelected={freePaidFilterOnSelected} {...fixFiltersSize} />
				)}
				<RadioDropDown group={statusFilterStructure} onSelected={statusFilterOnSelected} {...fixFiltersSize} />
				{!isPrivateAppsPage && (
					<CategoryDropDown categories={categories} selectedCategories={selectedCategories} onSelected={onSelected} {...fixFiltersSize} />
				)}
				<RadioDropDown group={sortFilterStructure} onSelected={sortFilterOnSelected} {...fixFiltersSize} />
			</FilterByText>
			<TagList categories={categoryTagList} onClick={onSelected} />
		</Box>
	);
};

export default AppsFilters;
