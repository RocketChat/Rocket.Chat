import { useBreakpoints } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from 'react-i18next';

import FilterByText from '../../../components/FilterByText';
import CategoryDropDown from '../components/CategoryFilter/CategoryDropDown';
import TagList from '../components/CategoryFilter/TagList';
import RadioDropDown from '../components/RadioDropDown/RadioDropDown';
import type { CategoryDropDownListProps, CategoryOnSelected, selectedCategoriesList } from '../definitions/CategoryDropdownDefinitions';
import type { RadioDropDownGroup, RadioDropDownOnSelected } from '../definitions/RadioDropDownDefinitions';
import AppsFilterSlot from './layout/AppsFilterSlot';
import AppsPageInset from './layout/AppsPageInset';

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
	const breakpoints = useBreakpoints();

	const appsSearchPlaceholders: { [key: string]: string } = {
		explore: t('Search_Apps'),
		enterprise: t('Search_Premium_Apps'),
		installed: t('Search_Installed_Apps'),
		requested: t('Search_Requested_Apps'),
		private: t('Search_Private_apps'),
	};

	const fixedWidthFilters = breakpoints.includes('lg');

	return (
		<AppsPageInset>
			<FilterByText value={text} onChange={(event) => setText(event.target.value)} placeholder={appsSearchPlaceholders[context]}>
				{!isPrivateAppsPage && (
					<AppsFilterSlot fixedWidth={fixedWidthFilters}>
						<RadioDropDown group={freePaidFilterStructure} onSelected={freePaidFilterOnSelected} />
					</AppsFilterSlot>
				)}
				<AppsFilterSlot fixedWidth={fixedWidthFilters}>
					<RadioDropDown group={statusFilterStructure} onSelected={statusFilterOnSelected} />
				</AppsFilterSlot>
				{!isPrivateAppsPage && (
					<AppsFilterSlot>
						<CategoryDropDown categories={categories} selectedCategories={selectedCategories} onSelected={onSelected} />
					</AppsFilterSlot>
				)}
				<AppsFilterSlot fixedWidth={fixedWidthFilters}>
					<RadioDropDown group={sortFilterStructure} onSelected={sortFilterOnSelected} />
				</AppsFilterSlot>
			</FilterByText>
			<TagList categories={categoryTagList} onClick={onSelected} />
		</AppsPageInset>
	);
};

export default AppsFilters;
