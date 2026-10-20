import { useFocusManager } from '@react-aria/focus';
import { useOverlayTrigger } from '@react-aria/overlays';
import { useOverlayTriggerState } from '@react-stately/overlays';
import { emptySearchFilters, type NavBarSearchFormValues } from '@rocket.chat/ai-search';
import { Box, TextInput } from '@rocket.chat/fuselage';
import { useMergedRefs, useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useCallback, useEffect, useRef } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import tinykeys from 'tinykeys';

import NavBarAISearchListBox from './NavBarAISearchListbox';
import NavBarSearchInputAddon from './NavBarSearchInputAddon';
import NavBarSearchListBox from './NavBarSearchListbox';
import { getShortcutLabel } from './getShortcutLabel';
import { useNavBarAISearch } from './hooks/useNavBarAISearch';
import { SearchActiveOptionContext, useSearchActiveOption } from './hooks/useSearchActiveOption';
import { useSearchClick } from './hooks/useSearchClick';
import { useSearchFocus } from './hooks/useSearchFocus';

const NavBarAISearch = () => {
	const { t } = useTranslation();
	const focusManager = useFocusManager();
	const shortcut = getShortcutLabel();

	const methods = useForm<NavBarSearchFormValues>({ defaultValues: { filterText: '', appliedFilters: emptySearchFilters() } });
	const { register, resetField, setFocus, setValue, watch } = methods;
	const { filterText = '', appliedFilters = emptySearchFilters() } = watch();

	const { ref: filterRef, ...rest } = register('filterText');

	const triggerRef = useRef(null);
	const mergedRefs = useMergedRefs(filterRef, triggerRef);

	const state = useOverlayTriggerState({});
	const { triggerProps, overlayProps } = useOverlayTrigger({ type: 'listbox' }, state, triggerRef);
	delete triggerProps.onPress;

	const { activeId, handleKeyDown, handleInput, contextValue } = useSearchActiveOption(state, overlayProps.id);
	const handleFocus = useSearchFocus(state);
	const handleClick = useSearchClick(state);

	const { aiSearchActive, canSearchWithAIFromTopBar, appliedFilterChips, aiSearchButtonTooltip, handleRemoveFilter, handleToggleAISearch } =
		useNavBarAISearch({ filterText, appliedFilters, setFocus, setValue, state, t });

	const searchLabel = aiSearchActive ? t('Search_rooms_or_ask_AI') : t('Search_rooms');
	const placeholder = [searchLabel, shortcut].filter(Boolean).join(' ');

	const handleEscSearch = useCallback(() => {
		resetField('filterText');
		setValue('appliedFilters', emptySearchFilters(), { shouldDirty: true });
		state.close();
	}, [resetField, setValue, state]);

	const handleClearText = useStableCallback(() => {
		resetField('filterText');
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
		<FormProvider {...methods}>
			<Box width='100%' maxWidth='x622' role='search' aria-label={searchLabel} marginInline={8} position='relative'>
				<TextInput
					{...rest}
					{...triggerProps}
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
							appliedFilterChips={appliedFilterChips}
							aiSearchActive={aiSearchActive}
							aiSearchButtonTooltip={aiSearchButtonTooltip}
							hasSearchText={Boolean(filterText)}
							onClearText={handleClearText}
							onRemoveFilter={handleRemoveFilter}
							onToggleAISearch={handleToggleAISearch}
							t={t}
						/>
					}
				/>
				{state.isOpen && (
					<SearchActiveOptionContext.Provider value={contextValue}>
						{aiSearchActive ? (
							<NavBarAISearchListBox
								state={state}
								overlayProps={overlayProps}
								aiSearchActive
								aiSearchAvailable={canSearchWithAIFromTopBar}
							/>
						) : (
							<NavBarSearchListBox state={state} overlayProps={overlayProps} />
						)}
					</SearchActiveOptionContext.Provider>
				)}
			</Box>
		</FormProvider>
	);
};

export default NavBarAISearch;
