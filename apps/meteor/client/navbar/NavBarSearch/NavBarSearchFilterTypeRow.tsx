import type { DraftSearchFilter } from '@rocket.chat/ai-search';
import { SEARCH_FILTER_KEYS, getSearchFilterConfig } from '@rocket.chat/ai-search';
import { Box, Button, Icon } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useSearchFilters } from './hooks/useSearchFilters';

export type NavBarSearchFilterTypeRowProps = {
	draft?: DraftSearchFilter;
};

const NavBarSearchFilterTypeRow = ({ draft }: NavBarSearchFilterTypeRowProps): ReactElement => {
	const { t } = useTranslation();
	const { startFilter } = useSearchFilters();

	return (
		<Box display='flex' gap={4} paddingInline={12} paddingBlockStart={12} role='group' aria-label={t('Filters')}>
			{SEARCH_FILTER_KEYS.map((key) => {
				const { icon, pillLabel } = getSearchFilterConfig(key);
				const isActive = draft?.key === key;

				return (
					<Button key={key} small primary={isActive} aria-pressed={isActive} onClick={() => startFilter(key)}>
						<Icon name={icon} size='x16' marginInlineEnd={4} />
						{t(pillLabel)}
					</Button>
				);
			})}
		</Box>
	);
};

export default NavBarSearchFilterTypeRow;
