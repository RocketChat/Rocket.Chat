import type { OverlayTriggerAria } from '@react-aria/overlays';
import type { OverlayTriggerState } from '@react-stately/overlays';
import type { NavBarSearchFormValues } from '@rocket.chat/ai-search';
import { Box, ToggleSwitch, Divider, Icon, Stack, PopoverSurface } from '@rocket.chat/fuselage';
import { useOutsideClick, useStableCallback } from '@rocket.chat/fuselage-hooks';
import { CustomScrollbars } from '@rocket.chat/ui-client';
import { useId, useMemo, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import NavBarSearchFilterSuggestions from './NavBarSearchFilterSuggestions';
import NavBarSearchFilterTypeRow from './NavBarSearchFilterTypeRow';
import NavBarSearchFiltersView from './NavBarSearchFiltersView';
import NavBarSearchIntelligentSection from './NavBarSearchIntelligentSection';
import NavBarSearchRoomSection from './NavBarSearchRoomSection';
import { useAISearchItems } from './hooks/useAISearchItems';
import { useAISearchRooms } from './hooks/useAISearchRooms';
import { useSyncSearchOptions } from './hooks/useSearchActiveOption';
import { useSearchFilters } from './hooks/useSearchFilters';
import AISearchErrorCallout from '../../components/AISearchErrorCallout';
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
	const aiSearchLabelId = useId();

	useOutsideClick([containerRef], state.close);

	const { control } = useFormContext<NavBarSearchFormValues>();
	const filterText = useWatch({ control, name: 'filterText' }) ?? '';
	const filters = useWatch({ control, name: 'filters' }) ?? [];
	const { clearQuery } = useSearchFilters();

	const handleSelect = useStableCallback(() => {
		state.close();
		clearQuery();
	});

	const { data: aiItems, isFetching, refetch: refetchAISearch } = useAISearchItems(filterText, filters, aiSearchActive);
	const { items: rooms, isLoading } = useAISearchRooms(aiSearchActive ? aiItems.searchText : filterText);
	useSyncSearchOptions(useMemo(() => [rooms, aiItems], [rooms, aiItems]));
	const itemCount = rooms.length + aiItems.intelligent.length + aiItems.filterSuggestions.length;
	const isSearchLoading = isLoading || isFetching;
	const hasAISearchProblem = aiSearchActive && Boolean(aiItems.error || aiItems.notConfigured);
	const listboxLabel = aiSearchActive ? t('AI_Search_results') : t('Channels');

	return (
		<Box ref={containerRef} position='absolute' zIndex={99} marginBlockStart={4} width='100%'>
			<PopoverSurface elevation='1' maxHeight='half-screen' flush={filtersOpen}>
				{filtersOpen ? (
					<NavBarSearchFiltersView id={overlayProps.id} filters={filters} onBack={onCloseFilters} />
				) : (
					<>
						<ResultsLiveRegion
							shouldAnnounce={!isSearchLoading && !(hasAISearchProblem && itemCount === 0)}
							itemCount={itemCount}
							isLoading={isSearchLoading}
						/>
						{aiSearchAvailable && (
							<>
								<Box display='flex' justifyContent='space-between' alignItems='center' paddingInline={12}>
									<Stack direction='row' align='center' gap='x4'>
										<Box is='span' id={aiSearchLabelId}>
											{t('AI_Search')}
										</Box>
										<Icon name='info' size={16} title={t('AI_Search_description')} />
									</Stack>
									<ToggleSwitch aria-labelledby={aiSearchLabelId} checked={aiSearchActive} onChange={handleToggleAISearch} />
								</Box>
								{aiSearchActive && <NavBarSearchFilterTypeRow draft={aiItems.draft} />}
							</>
						)}
						<div {...overlayProps} style={{ display: 'contents' }}>
							{aiSearchAvailable && (
								<>
									{aiItems.filterSuggestions.length > 0 && (
										<div
											role='listbox'
											aria-label={t('Search_filter_suggestions')}
											tabIndex={-1}
											onMouseDown={(event) => event.preventDefault()}
										>
											<NavBarSearchFilterSuggestions suggestions={aiItems.filterSuggestions} />
										</div>
									)}
									<Box paddingBlockStart={12} paddingBlockEnd={8}>
										<Divider flush />
									</Box>
									{hasAISearchProblem && (
										<Box marginInline={12} marginBlockStart={8}>
											<AISearchErrorCallout
												role='alert'
												error={aiItems.error}
												notConfigured={aiItems.notConfigured}
												onRetry={refetchAISearch}
											/>
										</Box>
									)}
								</>
							)}
							<CustomScrollbars>
								<div
									role='listbox'
									aria-label={listboxLabel}
									aria-busy={isSearchLoading}
									tabIndex={-1}
									onMouseDown={(event) => event.preventDefault()}
								>
									<NavBarSearchIntelligentSection items={aiItems.intelligent} onSelect={handleSelect} onClose={state.close} />
									{aiItems.intelligent.length > 0 && rooms.length > 0 && <Box marginBlockStart={12} />}
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
						</div>
					</>
				)}
			</PopoverSurface>
		</Box>
	);
};

export default NavBarAISearchListBox;
