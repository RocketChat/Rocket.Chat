import type { NavBarSearchFormValues } from '@rocket.chat/ai-search';
import { serializeSearchQuery } from '@rocket.chat/ai-search';
import { Box, Button, IconButton, ItemActions, ItemGroupHeader, ItemGroupTitle } from '@rocket.chat/fuselage';
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
		<Box display='flex' flexDirection='column'>
			<ItemGroupHeader inset='md'>
				<ItemGroupTitle aria-hidden>{t('AI_results')}</ItemGroupTitle>
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
			{items.map((item) => (
				<NavBarSearchMessageRow key={`intelligent-${item._id}`} item={item} onClick={onSelect} />
			))}
			<Button is='a' href={searchHref} marginInline={12} marginBlockStart={12} onClick={onClose}>
				{t('View_all_results')}
			</Button>
		</Box>
	);
};

export default NavBarSearchIntelligentSection;
