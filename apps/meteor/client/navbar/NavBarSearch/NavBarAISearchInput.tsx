import { useFocusManager } from '@react-aria/focus';
import { useOverlayTrigger } from '@react-aria/overlays';
import { useOverlayTriggerState } from '@react-stately/overlays';
import type { NavBarSearchFormValues } from '@rocket.chat/ai-search';
import { Box, TextInput } from '@rocket.chat/fuselage';
import { useMergedRefs, useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { ChangeEvent, FocusEvent, KeyboardEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import tinykeys from 'tinykeys';

import NavBarAISearchListBox from './NavBarAISearchListbox';
import NavBarSearchInputAddon from './NavBarSearchInputAddon';
import { getShortcutLabel } from './getShortcutLabel';
import { useNavBarAISearch } from './hooks/useNavBarAISearch';
import { SearchActiveOptionContext, useSearchActiveOption } from './hooks/useSearchActiveOption';
import { useSearchClick } from './hooks/useSearchClick';
import { useSearchFilters } from './hooks/useSearchFilters';
import { useSearchFocus } from './hooks/useSearchFocus';

const NavBarAISearchInput = () => {
	const { t } = useTranslation();
	const focusManager = useFocusManager();
	const shortcut = getShortcutLabel();

	const { control, register, setFocus } = useFormContext<NavBarSearchFormValues>();
	const filterText = useWatch({ control, name: 'filterText' });
	const { ref: filterRef, onChange: registerOnChange, ...rest } = register('filterText');

	const triggerRef = useRef(null);
	const mergedRefs = useMergedRefs(filterRef, triggerRef);

	const state = useOverlayTriggerState({});
	const { triggerProps, overlayProps } = useOverlayTrigger({ type: 'listbox' }, state, triggerRef);
	delete triggerProps.onPress;

	const { activeId, handleKeyDown: handleSearchKeyDown, handleInput, contextValue } = useSearchActiveOption(state, overlayProps.id);
	const handleFocus = useSearchFocus(state);
	const handleClick = useSearchClick(state);

	const { aiSearchActive, canSearchWithAIFromTopBar, handleToggleAISearch: toggleAISearch } = useNavBarAISearch({ setFocus, state, t });
	const { filters, removeFilter, clearFilters, clearQuery, handleTextChange } = useSearchFilters({ aiSearchActive });
	const [filtersRequested, setFiltersRequested] = useState(false);
	const filtersOpen = filtersRequested && filters.length > 0;

	const searchLabel = aiSearchActive ? t('Search_rooms_or_ask_AI') : t('Search_rooms');
	const placeholder = [searchLabel, shortcut].filter(Boolean).join(' ');

	const handleChange = useStableCallback((event: ChangeEvent<HTMLInputElement>) => {
		registerOnChange(event);
		setFiltersRequested(false);
		handleTextChange(event.currentTarget.value);
	});

	const handleKeyDown = useStableCallback((event: KeyboardEvent<HTMLInputElement>) => {
		if (event.code === 'Tab' && !event.shiftKey && state.isOpen) {
			return;
		}

		handleSearchKeyDown(event);
	});

	const handleRegionKeyDown = useStableCallback((event: KeyboardEvent<HTMLElement>) => {
		if (event.target === triggerRef.current || filtersOpen || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) {
			return;
		}

		setFocus('filterText');
		handleSearchKeyDown(event);
	});

	const handleBlur = useStableCallback((event: FocusEvent<HTMLElement>) => {
		if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) {
			state.close();
		}
	});

	const handleEscSearch = useCallback(() => {
		clearQuery();
		setFiltersRequested(false);
		state.close();
	}, [clearQuery, state]);

	const handleToggleAISearch = useStableCallback(() => {
		if (aiSearchActive) {
			clearFilters();
		}

		toggleAISearch();
	});

	const handleToggleFilters = useStableCallback(() => {
		setFiltersRequested((current) => !current);
		state.open();
	});

	const handleClearText = useStableCallback(() => {
		handleTextChange('');
		clearFilters();
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
		<Box
			width='100%'
			maxWidth='x622'
			role='search'
			aria-label={searchLabel}
			marginInline={8}
			position='relative'
			onBlur={handleBlur}
			onKeyDown={handleRegionKeyDown}
		>
			<TextInput
				{...rest}
				{...triggerProps}
				aria-haspopup={filtersOpen ? 'dialog' : 'listbox'}
				onChange={handleChange}
				onFocus={handleFocus}
				onKeyDown={handleKeyDown}
				onInput={handleInput}
				aria-activedescendant={activeId}
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
			{state.isOpen && (
				<SearchActiveOptionContext.Provider value={contextValue}>
					<NavBarAISearchListBox
						state={state}
						overlayProps={overlayProps}
						aiSearchActive={aiSearchActive}
						handleToggleAISearch={handleToggleAISearch}
						aiSearchAvailable={canSearchWithAIFromTopBar}
						filtersOpen={filtersOpen}
						onCloseFilters={() => setFiltersRequested(false)}
					/>
				</SearchActiveOptionContext.Provider>
			)}
		</Box>
	);
};

export default NavBarAISearchInput;
