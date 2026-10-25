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
	return (
		<Box display='flex' alignItems='center' gap={8}>
			{filters.length > 1 ? (
				<Chip small aria-expanded={filtersOpen} onClick={onToggleFilters} renderDismissSymbol={() => null}>
					<Box is='span' display='flex' alignItems='center' gap={4}>
						{t('Search_filters_with_count', { count: filters.length })}
						<Icon name={filtersOpen ? 'chevron-up' : 'chevron-down'} size='x16' />
					</Box>
				</Chip>
			) : (
				<NavBarSearchFilterChips filters={filters} onRemove={onRemoveFilter} />
			)}
			{hasSearchText ? (
				<IconButton mini icon='cross' title={t('clear')} onClick={onClearText} />
			) : (
				<Icon name='magnifier' size='x20' title={t('Search')} />
			)}
		</Box>
	);
};

export default NavBarSearchInputAddon;
