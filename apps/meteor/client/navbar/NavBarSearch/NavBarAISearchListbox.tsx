import type { OverlayTriggerAria } from '@react-aria/overlays';
import type { OverlayTriggerState } from '@react-stately/overlays';
import { emptySearchFilters, type NavBarSearchFormValues } from '@rocket.chat/ai-search';
import { Tile } from '@rocket.chat/fuselage';
import { useOutsideClick, useStableCallback } from '@rocket.chat/fuselage-hooks';
import { CustomScrollbars } from '@rocket.chat/ui-client';
import { useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import NavBarSearchFilterSuggestions from './NavBarSearchFilterSuggestions';
import NavBarSearchIntelligentSection from './NavBarSearchIntelligentSection';
import NavBarSearchRoomSection from './NavBarSearchRoomSection';
import { useAISearchItems } from './hooks/useAISearchItems';
import { useAISearchRooms } from './hooks/useAISearchRooms';
import { useListboxNavigation } from './hooks/useSearchNavigation';
import ResultsLiveRegion from '../../components/ResultsLiveRegion';

export type NavBarAISearchListBoxProps = {
	state: OverlayTriggerState;
	overlayProps: OverlayTriggerAria['overlayProps'];
	aiSearchActive: boolean;
	aiSearchAvailable: boolean;
};

const NavBarAISearchListBox = ({ state, overlayProps, aiSearchActive, aiSearchAvailable }: NavBarAISearchListBoxProps) => {
	const { t } = useTranslation();
	const containerRef = useRef<HTMLElement>(null);

	const handleKeyDown = useListboxNavigation(state);
	useOutsideClick([containerRef], state.close);

	const { resetField, setValue, watch } = useFormContext<NavBarSearchFormValues>();
	const { filterText = '', appliedFilters = emptySearchFilters() } = watch();

	const handleSelect = useStableCallback(() => {
		state.close();
		resetField('filterText');
		setValue('appliedFilters', emptySearchFilters(), { shouldDirty: true });
	});

	const { data: aiItems, isFetching } = useAISearchItems(filterText, appliedFilters, aiSearchActive);
	const { items: rooms, isLoading } = useAISearchRooms(aiSearchActive ? aiItems.searchText : filterText);
	const itemCount = rooms.length + aiItems.intelligent.length + aiItems.filterSuggestions.length;
	const isSearchLoading = isLoading || isFetching;
	const listboxLabel = aiSearchActive ? t('AI_Search_results') : t('Channels');

	return (
		<Tile
			ref={containerRef}
			position='absolute'
			zIndex={99}
			padding={0}
			paddingBlock={16}
			marginBlockStart={4}
			minHeight='x52'
			maxHeight='50vh'
			display='flex'
			width='100%'
			flexDirection='column'
		>
			<ResultsLiveRegion shouldAnnounce={!isSearchLoading} itemCount={itemCount} isLoading={isSearchLoading} />
			<CustomScrollbars>
				<div {...overlayProps} role='listbox' aria-label={listboxLabel} aria-busy={isSearchLoading} tabIndex={-1} onKeyDown={handleKeyDown}>
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

export default NavBarAISearchListBox;
