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
	const isLg = breakpoints.includes('lg');

	const appsSearchPlaceholders: { [key: string]: string } = {
		explore: t('Search_Apps'),
		enterprise: t('Search_Premium_Apps'),
		installed: t('Search_Installed_Apps'),
		requested: t('Search_Requested_Apps'),
		private: t('Search_Private_apps'),
	};

	const filterBoxProps = isLg ? { maxWidth: 'x200', minWidth: 'x200' } : { minWidth: 'x0' };

	return (
		<Box pi={24} display='flex' flexDirection='column' style={{ rowGap: '8px' }}>
			<FilterByText value={text} onChange={(event) => setText(event.target.value)} placeholder={appsSearchPlaceholders[context]} />
			<Box display='flex' flexDirection='row' flexWrap='wrap' alignItems='center' mbs={-16} style={{ gap: '8px' }}>
				{!isPrivateAppsPage && (
					<Box position='relative' flexGrow={1} flexShrink={1} flexBasis='x0' {...filterBoxProps}>
						<RadioDropDown group={freePaidFilterStructure} onSelected={freePaidFilterOnSelected} width='100%' />
					</Box>
				)}
				<Box position='relative' flexGrow={1} flexShrink={1} flexBasis='x0' {...filterBoxProps}>
					<RadioDropDown group={statusFilterStructure} onSelected={statusFilterOnSelected} width='100%' />
				</Box>
				{!isPrivateAppsPage && (
					<Box position='relative' flexGrow={1} flexShrink={1} flexBasis='x0' {...filterBoxProps}>
						<CategoryDropDown categories={categories} selectedCategories={selectedCategories} onSelected={onSelected} width='100%' />
					</Box>
				)}
				<Box position='relative' flexGrow={1} flexShrink={1} flexBasis='x0' {...filterBoxProps}>
					<RadioDropDown group={sortFilterStructure} onSelected={sortFilterOnSelected} width='100%' />
				</Box>
			</Box>
			<TagList categories={categoryTagList} onClick={onSelected} />
		</Box>
	);
};

export default AppsFilters;