import { serializeSearchQuery, type NavBarSearchFormValues } from '@rocket.chat/ai-search';
import { Box, Button } from '@rocket.chat/fuselage';
import type { UnifiedSearchIntelligentResult } from '@rocket.chat/rest-typings';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import { useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import NavBarSearchMessageRow from './NavBarSearchMessageRow';

const NavBarSearchIntelligentSection = ({
	items,
	showAction,
	onSelect,
	onClose,
}: {
	items: UnifiedSearchIntelligentResult[];
	showAction: boolean;
	onSelect: () => void;
	onClose: () => void;
}): ReactElement | null => {
	const { t } = useTranslation();
	const router = useRouter();
	const { watch } = useFormContext<NavBarSearchFormValues>();
	const { filterText, appliedFilters } = watch();

	const handleOpenAISearch = useCallback(() => {
		const query = serializeSearchQuery(filterText, appliedFilters);
		router.navigate({
			name: 'search',
			search: query ? { q: query } : {},
		});
		onClose();
	}, [appliedFilters, filterText, onClose, router]);

	if (!items.length && !showAction) {
		return null;
	}

	return (
		<Box
			display='flex'
			flexDirection='column'
			pbs={8}
			pbe={12}
			borderBlockEndWidth={1}
			borderBlockEndStyle='solid'
			borderBlockEndColor='stroke-extra-light'
		>
			<Box color='titles-labels' fontScale='c1' fontWeight='bold' pi={12} mbe={4} role='presentation' aria-hidden>
				{t('Intelligent_Search')}
			</Box>
			{items.length > 0 && (
				<Box color='hint' fontScale='c1' pi={12} mbe={4}>
					{t('AI_Search_related_messages', { count: items.length })}
				</Box>
			)}
			{items.map((item) => (
				<NavBarSearchMessageRow key={`intelligent-${item._id}`} type='intelligent' item={item} onClick={onSelect} />
			))}
			{showAction && (
				<Box pi={12} pbs={4}>
					<Button small role='option' onClick={handleOpenAISearch} title={t('Open_AI_Search')}>
						{t('Open_AI_Search')}
					</Button>
				</Box>
			)}
		</Box>
	);
};

export default NavBarSearchIntelligentSection;
