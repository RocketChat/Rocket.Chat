import type { AppliedFilter } from '@rocket.chat/ai-search';
import { Box, Button, Icon, IconButton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import NavBarSearchFilterChips from './NavBarSearchFilterChips';
import { useSearchFilters } from './hooks/useSearchFilters';

export type NavBarSearchFiltersViewProps = {
	filters: AppliedFilter[];
	onBack: () => void;
};

const NavBarSearchFiltersView = ({ filters, onBack }: NavBarSearchFiltersViewProps): ReactElement => {
	const { t } = useTranslation();
	const { removeFilter, clearFilters } = useSearchFilters();

	return (
		<Box paddingInline={12} paddingBlock={12} display='flex' flexDirection='column' gap={12}>
			<Box display='flex' alignItems='center' justifyContent='space-between' gap={8}>
				<Box display='flex' alignItems='center' gap={4} minWidth={0}>
					<IconButton mini icon='arrow-back' aria-label={t('Back')} onClick={onBack} />
					<Box is='h3' fontScale='h5' withTruncatedText>
						{t('Search_filters_with_count', { count: filters.length })}
					</Box>
				</Box>
				<Button small secondary flexShrink={0} onClick={clearFilters}>
					<Icon name='cross' size='x16' marginInlineEnd={4} />
					{t('Clear_all')}
				</Button>
			</Box>
			<NavBarSearchFilterChips filters={filters} onRemove={removeFilter} wrap />
		</Box>
	);
};

export default NavBarSearchFiltersView;
