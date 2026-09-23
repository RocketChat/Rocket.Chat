import type { OverlayTriggerAria } from '@react-aria/overlays';
import type { OverlayTriggerState } from '@react-stately/overlays';
import type { NavBarSearchFormValues } from '@rocket.chat/ai-search';
import { Tile, Box, ToggleSwitch, Divider, Icon } from '@rocket.chat/fuselage';
import { useOutsideClick, useStableCallback } from '@rocket.chat/fuselage-hooks';
import { CustomScrollbars } from '@rocket.chat/ui-client';
import { useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import NavBarSearchFilterSuggestions from './NavBarSearchFilterSuggestions';
import NavBarSearchFilterTypeRow from './NavBarSearchFilterTypeRow';
import NavBarSearchFiltersView from './NavBarSearchFiltersView';
import NavBarSearchIntelligentSection from './NavBarSearchIntelligentSection';
import NavBarSearchRoomSection from './NavBarSearchRoomSection';
import { useAISearchItems } from './hooks/useAISearchItems';
import { useAISearchRooms } from './hooks/useAISearchRooms';
import { useSearchFilters } from './hooks/useSearchFilters';
import { useListboxNavigation } from './hooks/useSearchNavigation';
import ResultsLiveRegion from '../../components/ResultsLiveRegion';

export type NavBarAISearchListBoxProps = {
	state: OverlayTriggerState;
	overlayProps: OverlayTriggerAria['overlayProps'];
	aiSearchActive: boolean;
	aiSearchAvailable: boolean;
	filtersOpen: boolean;
	handleToggleAISearch: () => void;
	onCloseFilters: () => void;
};

const NavBarAISearchListBox = ({
	state,
	overlayProps,
	aiSearchActive,
	aiSearchAvailable,
	filtersOpen,
	handleToggleAISearch,
	onCloseFilters,
}: NavBarAISearchListBoxProps) => {
	const { t } = useTranslation();
	const containerRef = useRef<HTMLElement>(null);

	const handleKeyDown = useListboxNavigation(state);
	useOutsideClick([containerRef], state.close);

	const { control } = useFormContext<NavBarSearchFormValues>();
	const filterText = useWatch({ control, name: 'filterText' }) ?? '';
	const filters = useWatch({ control, name: 'filters' }) ?? [];
	const { clearQuery } = useSearchFilters();

	const handleSelect = useStableCallback(() => {
		state.close();
		clearQuery();
	});

	const { data: aiItems, isFetching } = useAISearchItems(filterText, filters, aiSearchActive);
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
			paddingBlock={filtersOpen ? 0 : 12}
			marginBlockStart={4}
			minHeight='x52'
			maxHeight='50vh'
			display='flex'
			width='100%'
			flexDirection='column'
		>
			{filtersOpen ? (
				<NavBarSearchFiltersView filters={filters} onBack={onCloseFilters} />
			) : (
				<>
					<ResultsLiveRegion shouldAnnounce={!isSearchLoading} itemCount={itemCount} isLoading={isSearchLoading} />
					<Box display='flex' justifyContent='space-between' alignItems='center' paddingInline={12}>
						<Box display='flex' alignItems='center'>
							{t('AI_Search')}
							<Icon name='info' size={16} marginInlineStart={2} title={t('AI_Search_description')} />
						</Box>
						<ToggleSwitch checked={aiSearchActive} onChange={handleToggleAISearch} />
					</Box>
					{aiSearchActive && <NavBarSearchFilterTypeRow draft={aiItems.draft} />}
					<Divider marginBlockStart={12} />
					<CustomScrollbars>
						<div
							{...overlayProps}
							role='listbox'
							aria-label={listboxLabel}
							aria-busy={isSearchLoading}
							tabIndex={-1}
							onKeyDown={handleKeyDown}
						>
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
				</>
			)}
		</Tile>
	);
};

export default NavBarAISearchListBox;
