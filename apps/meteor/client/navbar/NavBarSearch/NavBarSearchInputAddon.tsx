import type { AppliedFilter } from '@rocket.chat/ai-search';
import { Box, Chip, Icon, IconButton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import NavBarSearchFilterChips from './NavBarSearchFilterChips';

export type NavBarSearchInputAddonProps = {
	filters: AppliedFilter[];
	filtersOpen: boolean;
	hasSearchText: boolean;
	onClearText: () => void;
	onRemoveFilter: (id: string) => void;
	onToggleFilters: () => void;
};

const NavBarSearchInputAddon = ({
	filters,
	filtersOpen,
	hasSearchText,
	onClearText,
	onRemoveFilter,
	onToggleFilters,
}: NavBarSearchInputAddonProps): ReactElement => {
	const { t } = useTranslation();
	console.log('filters', filters);
	return (
		<Box display='flex' alignItems='center' gap={8}>
			{filters.length > 1 ? (
				<Chip height='x20' minHeight='x20' aria-expanded={filtersOpen} onClick={onToggleFilters} renderDismissSymbol={() => null}>
					<Box is='span' display='flex' alignItems='center'>
						{t('Search_filters_with_count', { count: filters.length })}
						<Icon name={filtersOpen ? 'chevron-up' : 'chevron-down'} size='x16' marginInlineStart={4} />
					</Box>
				</Chip>
			) : (
				<NavBarSearchFilterChips filters={filters} onRemove={onRemoveFilter} />
			)}
			{hasSearchText ? (
				<IconButton mini icon='cross' aria-label={t('Clear')} onClick={onClearText} />
			) : (
				<Icon name='magnifier' size='x20' aria-label={t('Search')} />
			)}
		</Box>
	);
};

export default NavBarSearchInputAddon;
