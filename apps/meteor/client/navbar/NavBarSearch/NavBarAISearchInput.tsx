import { useFocusManager } from '@react-aria/focus';
import { useOverlayTrigger } from '@react-aria/overlays';
import { useOverlayTriggerState } from '@react-stately/overlays';
import type { NavBarSearchFormValues } from '@rocket.chat/ai-search';
import { Box, TextInput } from '@rocket.chat/fuselage';
import { useMergedRefs, useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import tinykeys from 'tinykeys';

import NavBarAISearchListBox from './NavBarAISearchListbox';
import NavBarSearchInputAddon from './NavBarSearchInputAddon';
import NavBarSearchListBox from './NavBarSearchListbox';
import { getShortcutLabel } from './getShortcutLabel';
import { useNavBarAISearch } from './hooks/useNavBarAISearch';
import { useSearchClick } from './hooks/useSearchClick';
import { useSearchFilters } from './hooks/useSearchFilters';
import { useSearchFocus } from './hooks/useSearchFocus';
import { useSearchInputNavigation } from './hooks/useSearchNavigation';

const NavBarAISearchInput = () => {
	const { t } = useTranslation();
	const focusManager = useFocusManager();
	const shortcut = getShortcutLabel();

	const { control, register, setFocus } = useFormContext<NavBarSearchFormValues>();
	const filterText = useWatch({ control, name: 'filterText' });
	const { filters, removeFilter, removeLastFilter, clearQuery, handleTextChange } = useSearchFilters();
	const [filtersRequested, setFiltersRequested] = useState(false);
	const filtersOpen = filtersRequested && filters.length > 0;

	const { ref: filterRef, onChange: registerOnChange, ...rest } = register('filterText');

	const triggerRef = useRef(null);
	const mergedRefs = useMergedRefs(filterRef, triggerRef);

	const state = useOverlayTriggerState({});
	const { triggerProps, overlayProps } = useOverlayTrigger({ type: 'listbox' }, state, triggerRef);
	delete triggerProps.onPress;

	const handleSearchKeyDown = useSearchInputNavigation(state);
	const handleFocus = useSearchFocus(state);
	const handleClick = useSearchClick(state);

	const { aiSearchActive, canSearchWithAIFromTopBar, handleToggleAISearch } = useNavBarAISearch({ setFocus, state, t });

	const searchLabel = aiSearchActive ? t('Search_rooms_or_ask_AI') : t('Search_rooms');
	const placeholder = [searchLabel, shortcut].filter(Boolean).join(' ');

	const handleChange = useStableCallback((event: ChangeEvent<HTMLInputElement>) => {
		registerOnChange(event);
		setFiltersRequested(false);
		handleTextChange(event.currentTarget.value);
	});

	const handleKeyDown = useStableCallback((event: KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Backspace' && !event.currentTarget.value && filters.length) {
			event.preventDefault();
			removeLastFilter();
			return;
		}

		handleSearchKeyDown(event);
	});

	const handleEscSearch = useCallback(() => {
		clearQuery();
		setFiltersRequested(false);
		state.close();
	}, [clearQuery, state]);

	const handleToggleFilters = useStableCallback(() => {
		setFiltersRequested((current) => !current);
		state.open();
	});

	const handleClearText = useStableCallback(() => {
		handleTextChange('');
		setFocus('filterText');
	});

	useEffect(() => {
		const unsubscribe = tinykeys(window, {
			'$mod+K': (event) => {
				event.preventDefault();
				setFocus('filterText');
			},
			'$mod+P': (event) => {
				event.preventDefault();
				setFocus('filterText');
			},
			'Escape': (event) => {
				event.preventDefault();
				handleEscSearch();
			},
		});

		return (): void => {
			unsubscribe();
		};
	}, [focusManager, handleEscSearch, setFocus]);

	return (
		<Box width='100%' maxWidth='x622' role='search' aria-label={searchLabel} marginInline={8} position='relative'>
			<TextInput
				{...rest}
				{...triggerProps}
				onChange={handleChange}
				onFocus={handleFocus}
				onKeyDown={handleKeyDown}
				onClick={handleClick}
				autoComplete='off'
				placeholder={placeholder}
				ref={mergedRefs}
				role='combobox'
				aria-label={searchLabel}
				aria-autocomplete='list'
				aria-keyshortcuts='Control+K Meta+K Control+P Meta+P'
				small
				endAddon={
					<NavBarSearchInputAddon
						filters={filters}
						filtersOpen={filtersOpen}
						hasSearchText={Boolean(filterText)}
						onClearText={handleClearText}
						onRemoveFilter={removeFilter}
						onToggleFilters={handleToggleFilters}
					/>
				}
			/>
			{state.isOpen &&
				(aiSearchActive ? (
					<NavBarAISearchListBox
						state={state}
						overlayProps={overlayProps}
						aiSearchActive={aiSearchActive}
						handleToggleAISearch={handleToggleAISearch}
						aiSearchAvailable={canSearchWithAIFromTopBar}
						filtersOpen={filtersOpen}
						onCloseFilters={() => setFiltersRequested(false)}
					/>
				) : (
					<NavBarSearchListBox
						state={state}
						overlayProps={overlayProps}
						aiSearchActive={aiSearchActive}
						handleToggleAISearch={handleToggleAISearch}
					/>
				))}
		</Box>
	);
};

export default NavBarAISearchInput;
