import type { AppliedFilter } from '@rocket.chat/ai-search';
import { Box, Button, Icon, IconButton } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import NavBarSearchFilterChips from './NavBarSearchFilterChips';
import { useSearchFilters } from './hooks/useSearchFilters';

export type NavBarSearchFiltersViewProps = {
	id?: string;
	filters: AppliedFilter[];
	onBack: () => void;
};

const NavBarSearchFiltersView = ({ id, filters, onBack }: NavBarSearchFiltersViewProps): ReactElement => {
	const { t } = useTranslation();
	const headingId = useId();
	const { removeFilter, clearFilters } = useSearchFilters();

	return (
		<Box
			id={id}
			role='dialog'
			aria-labelledby={headingId}
			paddingInline={12}
			paddingBlock={12}
			display='flex'
			flexDirection='column'
			gap={12}
		>
			<Box display='flex' alignItems='center' justifyContent='space-between' gap={8}>
				<Box display='flex' alignItems='center' gap={4} minWidth={0}>
					<IconButton mini icon='arrow-back' aria-label={t('Back')} onClick={onBack} />
					<Box is='h3' id={headingId} fontScale='h5' withTruncatedText>
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
