import { Box, Icon, TextInput } from '@rocket.chat/fuselage';
import { useEffectEvent, useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { useCallback, useEffect, useRef } from 'react';
import { useFocusManager, useOverlayTrigger } from 'react-aria';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useOverlayTriggerState } from 'react-stately';
import tinykeys from 'tinykeys';

import NavBarSearchListBox from './NavBarSearchListbox';
import { getShortcutLabel } from './getShortcutLabel';
import { useSearchFocus } from './hooks/useSearchFocus';
import { useSearchInputNavigation } from './hooks/useSearchNavigation';

const NavBarSearch = () => {
	const { t } = useTranslation();
	const focusManager = useFocusManager();
	const shortcut = getShortcutLabel();

	const placeholder = [t('Search_rooms'), shortcut].filter(Boolean).join(' ');

	const methods = useForm({ defaultValues: { filterText: '' } });
	const {
		formState: { isDirty },
		register,
		resetField,
		setFocus,
	} = methods;

	const { ref: filterRef, ...rest } = register('filterText');

	const triggerRef = useRef(null);
	const mergedRefs = useMergedRefs(filterRef, triggerRef);

	const state = useOverlayTriggerState({});
	const { triggerProps, overlayProps } = useOverlayTrigger({ type: 'listbox' }, state, triggerRef);
	delete triggerProps.onPress;

	const handleKeyDown = useSearchInputNavigation(state);
	const handleFocus = useSearchFocus(state);

	const handleEscSearch = useCallback(() => {
		resetField('filterText');
		state.close();
	}, [resetField, state]);

	const handleClearText = useEffectEvent(() => {
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
			<Box width='100%' maxWidth='x622' role='search' mi={8} position='relative'>
				<TextInput
					{...rest}
					{...triggerProps}
					onFocus={handleFocus}
					onKeyDown={handleKeyDown}
					autoComplete='off'
					placeholder={placeholder}
					ref={mergedRefs}
					role='combobox'
					small
					addon={<Icon name={isDirty ? 'cross' : 'magnifier'} size='x20' onClick={handleClearText} />}
				/>
				{state.isOpen && <NavBarSearchListBox state={state} overlayProps={overlayProps} />}
			</Box>
		</FormProvider>
	);
};

export default NavBarSearch;
