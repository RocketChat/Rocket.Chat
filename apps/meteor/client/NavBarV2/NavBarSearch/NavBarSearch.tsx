import { Box, Icon, TextInput, Tile } from '@rocket.chat/fuselage';
import { useDebouncedValue, useEffectEvent, useMergedRefs, useOutsideClick } from '@rocket.chat/fuselage-hooks';
import type { KeyboardEvent } from 'react';
import { useCallback, useEffect, useRef } from 'react';
import { useFocusManager, useOverlayTrigger } from 'react-aria';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useOverlayTriggerState } from 'react-stately';
import tinykeys from 'tinykeys';

import NavBarSearchNoResults from './NavBarSearchNoResults';
import NavBarSearchRow from './NavBarSearchRow';
import { getShortcut } from './getShortcut';
import { useSearchItems } from './hooks/useSearchItems';
import { CustomScrollbars } from '../../components/CustomScrollbars';

const isOption = (node: Element) => node.getAttribute('role') === 'option';

const NavBarSearch = () => {
	const { t } = useTranslation();
	const focusManager = useFocusManager();
	const shortcut = getShortcut();

	const placeholder = [t('Search_rooms'), shortcut].filter(Boolean).join(' ');

	const {
		formState: { isDirty },
		register,
		watch,
		resetField,
		setFocus,
	} = useForm({ defaultValues: { filterText: '' } });
	const { ref: filterRef, ...rest } = register('filterText');
	const debouncedFilter = useDebouncedValue(watch('filterText'), 200);

	const { filterText } = watch();

	const { data: items = [], isLoading } = useSearchItems(debouncedFilter);

	const triggerRef = useRef(null);

	const state = useOverlayTriggerState({});
	const { triggerProps, overlayProps } = useOverlayTrigger({ type: 'listbox' }, state, triggerRef);
	delete triggerProps.onPress;

	const handleEscSearch = useCallback(() => {
		resetField('filterText');
		state.close();
	}, [resetField, state]);

	const handleClearText = useEffectEvent(() => {
		resetField('filterText');
		setFocus('filterText');
	});

	const handleSelect = useEffectEvent(() => {
		state.close();
		resetField('filterText');
	});

	const containerRef = useRef<HTMLElement>(null);
	const mergedRefs = useMergedRefs(filterRef, triggerRef);

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.code === 'Tab') {
			state.close();
		}

		if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
			e.preventDefault();

			if (e.code === 'ArrowUp') {
				return focusManager?.focusPrevious({
					wrap: true,
					accept: (node) => isOption(node),
				});
			}

			if (e.code === 'ArrowDown') {
				focusManager?.focusNext({
					wrap: true,
					accept: (node) => isOption(node),
				});
			}
		}
	};

	useOutsideClick([containerRef], state.close);

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
		<Box role='search' mie={8} width='x622' position='relative'>
			<TextInput
				{...rest}
				{...triggerProps}
				onFocus={() => state.setOpen(true)}
				onKeyDown={(e) => {
					state.setOpen(true);

					if ((e.code === 'Tab' && e.shiftKey) || e.key === 'Escape') {
						state.close();
					}

					if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
						e.preventDefault();

						focusManager?.focusNext({
							accept: (node) => isOption(node),
						});
					}
				}}
				autoComplete='off'
				placeholder={placeholder}
				ref={mergedRefs}
				role='combobox'
				small
				addon={<Icon name={isDirty ? 'cross' : 'magnifier'} size='x20' onClick={handleClearText} />}
			/>
			{state.isOpen && (
				<Tile
					ref={containerRef}
					position='absolute'
					zIndex={99}
					padding={0}
					pb={16}
					minHeight='x52'
					maxHeight='50vh'
					display='flex'
					width='100%'
					flexDirection='column'
					aria-live='polite'
					aria-atomic='true'
					aria-busy={isLoading}
				>
					<CustomScrollbars>
						<div {...overlayProps} role='listbox' aria-label={t('Channels')} tabIndex={-1} onKeyDown={handleKeyDown}>
							{items.length === 0 && !isLoading && <NavBarSearchNoResults />}
							{items.length > 0 && (
								<Box color='title-labels' fontScale='c1' fontWeight='bold' pi={12} mbe={4}>
									{filterText ? t('Results') : t('Recent')}
								</Box>
							)}
							{items.map((item) => (
								<div key={item._id}>
									<NavBarSearchRow room={item} onClick={handleSelect} />
								</div>
							))}
						</div>
					</CustomScrollbars>
				</Tile>
			)}
		</Box>
	);
};

export default NavBarSearch;
