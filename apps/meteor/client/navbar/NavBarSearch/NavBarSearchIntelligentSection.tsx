import type { NavBarSearchFormValues } from '@rocket.chat/ai-search';
import { serializeSearchQuery } from '@rocket.chat/ai-search';
import { Box, Divider, Icon, IconButton, ItemActions, ItemGroupHeader, ItemGroupTitle, SidebarItemIcon } from '@rocket.chat/fuselage';
import type { AISearchResult } from '@rocket.chat/rest-typings';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
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
			<ItemGroupHeader inset='md'>
				<ItemGroupTitle aria-hidden>{t('Intelligent_Search')}</ItemGroupTitle>
				<ItemActions>
					<IconButton
						is='a'
						href={searchHref}
						small
						icon='new-window'
						title={t('View_all_results')}
						aria-label={t('View_all_results')}
						onClick={onClose}
					/>
				</ItemActions>
			</ItemGroupHeader>
			<Box color='hint' fontScale='c1' paddingInline={12} marginBlockEnd={4}>
				{t('AI_Search_related_messages', { count: items.length })}
			</Box>
			{items.map((item) => (
				<NavBarSearchMessageRow key={`intelligent-${item._id}`} item={item} onClick={onSelect} />
			))}
			<NavBarSearchItem
				id='search-view-all-results'
				title={t('View_all_results')}
				avatar={null}
				icon={<SidebarItemIcon icon={<Icon name='arrow-forward' size='x16' />} />}
				href={searchHref}
				onClick={onClose}
			/>
		</Box>
	);
};

export default NavBarSearchIntelligentSection;
