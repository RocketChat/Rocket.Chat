import type { OverlayTriggerAria } from '@react-aria/overlays';
import type { OverlayTriggerState } from '@react-stately/overlays';
import { type NavBarSearchFormValues } from '@rocket.chat/ai-search';
import { Box, Tile } from '@rocket.chat/fuselage';
import { useStableCallback, useOutsideClick } from '@rocket.chat/fuselage-hooks';
import { CustomScrollbars } from '@rocket.chat/ui-client';
import { useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import NavBarSearchFilterSuggestions from './NavBarSearchFilterSuggestions';
import NavBarSearchIntelligentSection from './NavBarSearchIntelligentSection';
import NavBarSearchItemSkeleton from './NavBarSearchItemSkeleton';
import NavBarSearchNoResults from './NavBarSearchNoResults';
import NavBarSearchRow from './NavBarSearchRow';
import { useSearchItems } from './hooks/useSearchItems';
import { useListboxNavigation } from './hooks/useSearchNavigation';
import ResultsLiveRegion from '../../components/ResultsLiveRegion';

export type NavBarSearchListBoxProps = {
	state: OverlayTriggerState;
	overlayProps: OverlayTriggerAria['overlayProps'];
	aiSearchActive?: boolean;
	aiSearchAvailable?: boolean;
};

const NavBarSearchListBox = ({ state, overlayProps, aiSearchActive = false, aiSearchAvailable = false }: NavBarSearchListBoxProps) => {
	const { t } = useTranslation();
	const containerRef = useRef<HTMLElement>(null);

	const handleKeyDown = useListboxNavigation(state);
	useOutsideClick([containerRef], state.close);

	const { resetField, setValue, watch } = useFormContext<NavBarSearchFormValues>();
	const { filterText, appliedFilters } = watch();

	const handleSelect = useStableCallback(() => {
		state.close();
		resetField('filterText');
		setValue('appliedFilters', { roomNames: [], rids: [], fromUsernames: [] });
	});

	const {
		data: items = {
			rooms: [],
			intelligent: [],
			filterSuggestions: [],
			appliedFilters: [],
			searchText: '',
			filters: { roomNames: [], rids: [], fromUsernames: [] },
		},
		isLoading,
		isFetching,
	} = useSearchItems(filterText, appliedFilters, aiSearchActive);
	const itemCount = items.rooms.length + items.intelligent.length + items.filterSuggestions.length;

	return (
		<Tile
			ref={containerRef}
			position='absolute'
			zIndex={99}
			padding={0}
			pb={16}
			mbs={4}
			minHeight='x52'
			maxHeight='50vh'
			display='flex'
			width='100%'
			flexDirection='column'
		>
			<ResultsLiveRegion shouldAnnounce={!isLoading} itemCount={itemCount} isLoading={isLoading} />
			<CustomScrollbars>
				<div {...overlayProps} role='listbox' aria-label={t('Channels')} aria-busy={isLoading} tabIndex={-1} onKeyDown={handleKeyDown}>
					<NavBarSearchIntelligentSection items={items.intelligent} onSelect={handleSelect} onClose={state.close} />
					<NavBarSearchFilterSuggestions suggestions={items.filterSuggestions} />
					{itemCount === 0 && !isLoading && !isFetching && <NavBarSearchNoResults suggestAISearch={aiSearchAvailable && !aiSearchActive} />}
					{items.rooms.length > 0 && (
						<Box color='titles-labels' fontScale='c1' fontWeight='bold' pi={12} mbe={4} role='presentation' aria-hidden>
							{filterText ? t('Results') : t('Recent')}
						</Box>
					)}
					{items.rooms.map((item) => (
						<NavBarSearchRow key={item._id} room={item} onClick={handleSelect} />
					))}
					{isLoading && Array.from({ length: 4 }, (_, index) => <NavBarSearchItemSkeleton key={`skeleton-${index}`} />)}
				</div>
			</CustomScrollbars>
		</Tile>
	);
};

export default NavBarSearchListBox;
