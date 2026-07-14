import type { OverlayTriggerAria } from '@react-aria/overlays';
import type { OverlayTriggerState } from '@react-stately/overlays';
import { emptySearchFilters, type NavBarSearchFormValues } from '@rocket.chat/ai-search';
import { Tile } from '@rocket.chat/fuselage';
import { useStableCallback, useOutsideClick } from '@rocket.chat/fuselage-hooks';
import { CustomScrollbars } from '@rocket.chat/ui-client';
import { useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import NavBarSearchFilterSuggestions from './NavBarSearchFilterSuggestions';
import NavBarSearchIntelligentSection from './NavBarSearchIntelligentSection';
import NavBarSearchRoomSection from './NavBarSearchRoomSection';
import { useAISearchItems } from './hooks/useAISearchItems';
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
		setValue('appliedFilters', emptySearchFilters());
	});

	const { data: aiItems, isFetching } = useAISearchItems(filterText, appliedFilters, aiSearchActive);
	const { items: rooms, isLoading } = useSearchItems(aiSearchActive ? aiItems.searchText : filterText);
	const itemCount = rooms.length + aiItems.intelligent.length + aiItems.filterSuggestions.length;

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
					<NavBarSearchIntelligentSection items={aiItems.intelligent} onSelect={handleSelect} onClose={state.close} />
					<NavBarSearchFilterSuggestions suggestions={aiItems.filterSuggestions} />
					<NavBarSearchRoomSection
						filterText={filterText}
						itemCount={itemCount}
						isLoading={isLoading}
						isFetching={isFetching}
						rooms={rooms}
						suggestAISearch={aiSearchAvailable && !aiSearchActive}
						onSelect={handleSelect}
					/>
				</div>
			</CustomScrollbars>
		</Tile>
	);
};

export default NavBarSearchListBox;
