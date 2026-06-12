import type { OverlayTriggerAria } from '@react-aria/overlays';
import type { OverlayTriggerState } from '@react-stately/overlays';
import {
	mergeSearchFilters,
	parseSearchFilterText,
	serializeSearchQuery,
	type NavBarSearchFormValues,
	type SearchFilterSuggestion,
} from '@rocket.chat/ai-search';
import { Box, Button, Icon, SidebarV2Item, SidebarV2ItemIcon, SidebarV2ItemTitle, Tile } from '@rocket.chat/fuselage';
import { useDebouncedValue, useStableCallback, useOutsideClick } from '@rocket.chat/fuselage-hooks';
import { CustomScrollbars } from '@rocket.chat/ui-client';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { MouseEvent } from 'react';
import { useCallback, useMemo, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import NavBarSearchMessageRow from './NavBarSearchMessageRow';
import NavBarSearchNoResults from './NavBarSearchNoResults';
import NavBarSearchRow from './NavBarSearchRow';
import { useSearchItems } from './hooks/useSearchItems';
import { useListboxNavigation } from './hooks/useSearchNavigation';
import ResultsLiveRegion from '../../components/ResultsLiveRegion';

type NavBarSearchListBoxProps = {
	state: OverlayTriggerState;
	overlayProps: OverlayTriggerAria['overlayProps'];
	aiSearchActive?: boolean;
};

const filterSuggestionGroupLabels = {
	rooms: 'Search_filter_rooms',
	users: 'Search_filter_users',
	dates: 'Search_filter_dates',
} as const;

const groupFilterSuggestions = (suggestions: SearchFilterSuggestion[]): [SearchFilterSuggestion['group'], SearchFilterSuggestion[]][] => {
	const grouped: Record<SearchFilterSuggestion['group'], SearchFilterSuggestion[]> = { rooms: [], users: [], dates: [] };
	for (const suggestion of suggestions) {
		grouped[suggestion.group].push(suggestion);
	}

	const groups: [SearchFilterSuggestion['group'], SearchFilterSuggestion[]][] = [];
	for (const group of ['rooms', 'users', 'dates'] as const) {
		if (grouped[group].length > 0) {
			groups.push([group, grouped[group]]);
		}
	}

	return groups;
};

const NavBarSearchListBox = ({ state, overlayProps, aiSearchActive = false }: NavBarSearchListBoxProps) => {
	const { t } = useTranslation();
	const router = useRouter();
	const containerRef = useRef<HTMLElement>(null);

	const handleKeyDown = useListboxNavigation(state);
	useOutsideClick([containerRef], state.close);

	const { getValues, resetField, setFocus, setValue, watch } = useFormContext<NavBarSearchFormValues>();
	const { filterText, appliedFilters } = watch();

	const debouncedFilter = useDebouncedValue(filterText, 500);

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
	} = useSearchItems(debouncedFilter, appliedFilters, aiSearchActive);
	const itemCount = items.rooms.length + items.intelligent.length + items.filterSuggestions.length;
	const filterSuggestionGroups = useMemo(() => groupFilterSuggestions(items.filterSuggestions), [items.filterSuggestions]);

	const handleOpenAISearch = useCallback(() => {
		const query = serializeSearchQuery(filterText, appliedFilters);
		router.navigate({
			name: 'search',
			search: query ? { q: query } : {},
		});
		state.close();
	}, [appliedFilters, filterText, router, state]);

	const handleFilterSuggestion = useCallback(
		(event: MouseEvent, value: string) => {
			event.preventDefault();
			event.stopPropagation();
			const { searchText, filters } = parseSearchFilterText(value);
			setValue('appliedFilters', mergeSearchFilters(getValues('appliedFilters'), filters), { shouldDirty: true });
			setValue('filterText', searchText, { shouldDirty: true });
			setFocus('filterText');
		},
		[getValues, setFocus, setValue],
	);

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
			<ResultsLiveRegion shouldAnnounce={!isLoading} itemCount={itemCount} />
			<CustomScrollbars>
				<div {...overlayProps} role='listbox' aria-label={t('Channels')} aria-busy={isLoading} tabIndex={-1} onKeyDown={handleKeyDown}>
					{items.intelligent.length > 0 && (
						<Box
							display='flex'
							flexDirection='column'
							pbs={8}
							pbe={12}
							borderBlockEnd='var(--rcx-border-width-default) solid var(--rcx-color-stroke-extra-light)'
						>
							<Box color='titles-labels' fontScale='c1' fontWeight='bold' pi={12} mbe={4} role='presentation' aria-hidden>
								{t('Intelligent_Search')}
							</Box>
							<Box color='hint' fontScale='c1' pi={12} mbe={4}>
								{t('AI_Search_related_messages', { count: items.intelligent.length })}
							</Box>
							{items.intelligent.map((item) => (
								<NavBarSearchMessageRow key={`intelligent-${item._id}`} type='intelligent' item={item} onClick={handleSelect} />
							))}
							<Box pi={12} pbs={4}>
								<Button small onClick={handleOpenAISearch} title={t('Open_AI_Search')}>
									{t('Open_AI_Search')}
								</Button>
							</Box>
						</Box>
					)}
					{filterSuggestionGroups.map(([group, suggestions]) => (
						<Box key={group} display='flex' flexDirection='column' pbs={8}>
							<Box color='titles-labels' fontScale='c1' fontWeight='bold' pi={12} mbe={4} role='presentation' aria-hidden>
								{t(filterSuggestionGroupLabels[group])}
							</Box>
							{suggestions.map((item) => (
								<SidebarV2Item key={item.key} role='option' onClick={(event) => handleFilterSuggestion(event, item.value)}>
									<SidebarV2ItemIcon icon={<Icon name={item.icon} size='x16' />} />
									<SidebarV2ItemTitle>{item.title}</SidebarV2ItemTitle>
									<Box color='hint' fontScale='c1' flexShrink={0}>
										{item.description}
									</Box>
								</SidebarV2Item>
							))}
						</Box>
					))}
					{itemCount === 0 && !isLoading && !isFetching && <NavBarSearchNoResults />}
					{items.rooms.length > 0 && (
						<Box color='titles-labels' fontScale='c1' fontWeight='bold' pi={12} mbe={4} role='presentation' aria-hidden>
							{filterText ? t('Results') : t('Recent')}
						</Box>
					)}
					{items.rooms.map((item) => (
						<NavBarSearchRow key={item._id} room={item} onClick={handleSelect} />
					))}
				</div>
			</CustomScrollbars>
		</Tile>
	);
};

export default NavBarSearchListBox;
