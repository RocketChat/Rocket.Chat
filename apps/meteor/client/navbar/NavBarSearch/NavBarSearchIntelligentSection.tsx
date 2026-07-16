import { serializeSearchQuery, type NavBarSearchFormValues } from '@rocket.chat/ai-search';
import { Box, Icon, SidebarV2ItemIcon } from '@rocket.chat/fuselage';
import type { AISearchResult } from '@rocket.chat/rest-typings';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import NavBarSearchItem from './NavBarSearchItem';
import NavBarSearchMessageRow from './NavBarSearchMessageRow';

export type NavBarSearchIntelligentSectionProps = {
	items: AISearchResult[];
	onSelect: () => void;
	onClose: () => void;
};

const NavBarSearchIntelligentSection = ({ items, onSelect, onClose }: NavBarSearchIntelligentSectionProps): ReactElement | null => {
	const { t } = useTranslation();
	const router = useRouter();
	const { watch } = useFormContext<NavBarSearchFormValues>();
	const { filterText, appliedFilters } = watch();

	if (!items.length) {
		return null;
	}

	const query = serializeSearchQuery(filterText, appliedFilters);
	const searchHref = router.buildRoutePath({
		name: 'search',
		search: query ? { q: query } : {},
	});

	return (
		<Box display='flex' flexDirection='column' paddingBlockStart={8} paddingBlockEnd={12}>
			<Box color='titles-labels' fontScale='c2' paddingInline={16} marginBlockEnd={4} role='presentation' aria-hidden>
				{t('Intelligent_Search')}
			</Box>
			<Box color='hint' fontScale='c1' paddingInline={12} marginBlockEnd={4}>
				{t('AI_Search_related_messages', { count: items.length })}
			</Box>
			{items.map((item) => (
				<NavBarSearchMessageRow key={`intelligent-${item._id}`} item={item} onClick={onSelect} />
			))}
			<NavBarSearchItem
				title={t('View_all_results')}
				avatar={null}
				icon={<SidebarV2ItemIcon icon={<Icon name='arrow-forward' size='x16' />} />}
				href={searchHref}
				onClick={onClose}
			/>
		</Box>
	);
};

export default NavBarSearchIntelligentSection;
