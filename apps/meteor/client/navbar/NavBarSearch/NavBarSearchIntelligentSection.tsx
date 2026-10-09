import type { NavBarSearchFormValues } from '@rocket.chat/ai-search';
import { serializeSearchQuery } from '@rocket.chat/ai-search';
import { Box, Divider, IconButton } from '@rocket.chat/fuselage';
import type { AISearchResult } from '@rocket.chat/rest-typings';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import NavBarSearchMessageRow from './NavBarSearchMessageRow';

export type NavBarSearchIntelligentSectionProps = {
	items: AISearchResult[];
	onSelect: () => void;
	onClose: () => void;
};

const NavBarSearchIntelligentSection = ({ items, onSelect, onClose }: NavBarSearchIntelligentSectionProps): ReactElement | null => {
	const { t } = useTranslation();
	const router = useRouter();
	const { control } = useFormContext<NavBarSearchFormValues>();
	const filterText = useWatch({ control, name: 'filterText' }) ?? '';
	const filters = useWatch({ control, name: 'filters' }) ?? [];

	if (!items.length) {
		return null;
	}

	const query = serializeSearchQuery({ text: filterText, filters });
	const searchHref = router.buildRoutePath({
		name: 'search',
		search: query ? { q: query } : {},
	});

	return (
		<Box display='flex' flexDirection='column' paddingBlockEnd={12}>
			<Divider marginBlockStart={12} marginBlockEnd={8} />
			<Box display='flex' alignItems='center' justifyContent='space-between' paddingInline={16} marginBlockEnd={4}>
				<Box color='titles-labels' fontScale='c2' role='presentation' aria-hidden>
					{t('Intelligent_Search')}
				</Box>
				<IconButton
					is='a'
					href={searchHref}
					small
					icon='new-window'
					title={t('View_all_results')}
					aria-label={t('View_all_results')}
					onClick={onClose}
				/>
			</Box>
			<Box color='hint' fontScale='c1' paddingInline={12} marginBlockEnd={4}>
				{t('AI_Search_related_messages', { count: items.length })}
			</Box>
			{items.map((item) => (
				<NavBarSearchMessageRow key={`intelligent-${item._id}`} item={item} onClick={onSelect} />
			))}
		</Box>
	);
};

export default NavBarSearchIntelligentSection;
