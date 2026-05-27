import type { OverlayTriggerAria } from '@react-aria/overlays';
import type { OverlayTriggerState } from '@react-stately/overlays';
import { Box, Button, Chip, Icon, SidebarV2Item, SidebarV2ItemIcon, SidebarV2ItemTitle, Tile } from '@rocket.chat/fuselage';
import { useDebouncedValue, useOutsideClick } from '@rocket.chat/fuselage-hooks';
import { CustomScrollbars } from '@rocket.chat/ui-client';
import { useRouter } from '@rocket.chat/ui-contexts';
import type { MouseEvent } from 'react';
import { useCallback, useRef } from 'react';
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
};

const NavBarSearchListBox = ({ state, overlayProps }: NavBarSearchListBoxProps) => {
	const { t } = useTranslation();
	const router = useRouter();
	const containerRef = useRef<HTMLElement>(null);

	const handleKeyDown = useListboxNavigation(state);
	useOutsideClick([containerRef], state.close);

	const { resetField, setFocus, setValue, watch } = useFormContext<{ filterText: string }>();
	const { filterText } = watch();

	const debouncedFilter = useDebouncedValue(filterText, 500);

	const handleSelect = useCallback(() => {
		state.close();
		resetField('filterText');
	}, [resetField, state]);

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
	} = useSearchItems(debouncedFilter);
	const itemCount = items.rooms.length + items.intelligent.length + items.filterSuggestions.length;

	const handleOpenAISearch = useCallback(() => {
		router.navigate({
			name: 'search',
			search: filterText?.trim() ? { q: filterText.trim() } : {},
		});
		state.close();
	}, [filterText, router, state]);

	const handleFilterSuggestion = useCallback(
		(event: MouseEvent, value: string) => {
			event.preventDefault();
			event.stopPropagation();
			setValue('filterText', value, { shouldDirty: true });
			setFocus('filterText');
		},
		[setFocus, setValue],
	);

	const handleRemoveFilter = useCallback(
		(event: MouseEvent, value: string) => {
			event.preventDefault();
			event.stopPropagation();
			setValue('filterText', value, { shouldDirty: true });
			setFocus('filterText');
		},
		[setFocus, setValue],
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
					{items.appliedFilters.length > 0 && (
						<Box
							display='flex'
							flexWrap='wrap'
							alignItems='center'
							pi={12}
							pbs={8}
							pbe={8}
							style={{ gap: 4 }}
							borderBlockEnd='var(--rcx-border-width-default) solid var(--rcx-color-stroke-extra-light)'
						>
							<Box color='hint' fontScale='c1' mie={4}>
								{t('Filters')}:
							</Box>
							{items.appliedFilters.map((filter) => (
								<Chip
									key={filter.key}
									height='x20'
									value={filter.label}
									onClick={(event) => handleRemoveFilter(event, filter.nextFilterText)}
								>
									{filter.label}
								</Chip>
							))}
						</Box>
					)}
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
					{items.filterSuggestions.map((item) => (
						<SidebarV2Item key={item.key} role='option' onClick={(event) => handleFilterSuggestion(event, item.value)}>
							<SidebarV2ItemIcon icon={<Icon name='sort' size='x16' />} />
							<SidebarV2ItemTitle>{item.title}</SidebarV2ItemTitle>
							<Box color='hint' fontScale='c1' flexShrink={0}>
								{item.description}
							</Box>
						</SidebarV2Item>
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
