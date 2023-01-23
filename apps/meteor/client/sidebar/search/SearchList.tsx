import { css } from '@rocket.chat/css-in-js';
import { Sidebar, TextInput, Box, Icon } from '@rocket.chat/fuselage';
import { useMutableCallback, useDebouncedValue, useAutoFocus, useUniqueId, useMergedRefs } from '@rocket.chat/fuselage-hooks';
import { useUserPreference, useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';
import type { ReactElement, MutableRefObject, SetStateAction, Dispatch, FormEventHandler, Ref, MouseEventHandler } from 'react';
import React, { forwardRef, useState, useMemo, useEffect, useRef } from 'react';
import type { VirtuosoHandle } from 'react-virtuoso';
import { Virtuoso } from 'react-virtuoso';
import tinykeys from 'tinykeys';

import { useAvatarTemplate } from '../hooks/useAvatarTemplate';
import { usePreventDefault } from '../hooks/usePreventDefault';
import { useTemplateByViewMode } from '../hooks/useTemplateByViewMode';
import Row from './Row';
import ScrollerWithCustomProps from './ScrollerWithCustomProps';
import { useSearchItems } from './useSearchItems';

const shortcut = ((): string => {
	if (!(Meteor as any).Device.isDesktop()) {
		return '';
	}
	if (window.navigator.platform.toLowerCase().includes('mac')) {
		return '(\u2318+K)';
	}
	return '(\u2303+K)';
})();

const useInput = (initial: string): { value: string; onChange: FormEventHandler; setValue: Dispatch<SetStateAction<string>> } => {
	const [value, setValue] = useState(initial);
	const onChange = useMutableCallback((e) => {
		setValue(e.currentTarget.value);
	});
	return { value, onChange, setValue };
};

const toggleSelectionState = (next: HTMLElement, current: HTMLElement | undefined, input: HTMLElement | undefined): void => {
	input?.setAttribute('aria-activedescendant', next.id);
	next.setAttribute('aria-selected', 'true');
	next.classList.add('rcx-sidebar-item--selected');
	if (current) {
		current.removeAttribute('aria-selected');
		current.classList.remove('rcx-sidebar-item--selected');
	}
};

/**
 * @type import('react').ForwardRefExoticComponent<{ onClose: unknown } & import('react').RefAttributes<HTMLElement>>
 */

type SearchListProps = {
	onClose: () => void;
};

const SearchList = forwardRef(function SearchList({ onClose }: SearchListProps, ref): ReactElement {
	const listId = useUniqueId();
	const t = useTranslation();
	const { setValue: setFilterValue, ...filter } = useInput('');

	const cursorRef = useRef<HTMLInputElement>(null);
	const autofocus: Ref<HTMLInputElement> = useMergedRefs(useAutoFocus<HTMLInputElement>(), cursorRef);

	const listRef = useRef<VirtuosoHandle>(null);
	const boxRef = useRef<HTMLDivElement>(null);

	const selectedElement: MutableRefObject<HTMLElement | null | undefined> = useRef(null);
	const itemIndexRef = useRef(0);

	const sidebarViewMode = useUserPreference('sidebarViewMode');
	const useRealName = useSetting('UI_Use_Real_Name');

	const sideBarItemTemplate = useTemplateByViewMode();
	const avatarTemplate = useAvatarTemplate();

	const extended = sidebarViewMode === 'extended';

	const filterText = useDebouncedValue(filter.value, 100);

	const placeholder = [t('Search'), shortcut].filter(Boolean).join(' ');

	const { data: items = [], isLoading } = useSearchItems(filterText);

	const itemData = useMemo(
		() => ({
			items,
			t,
			SideBarItemTemplate: sideBarItemTemplate,
			avatarTemplate,
			useRealName,
			extended,
			sidebarViewMode,
		}),
		[avatarTemplate, extended, items, useRealName, sideBarItemTemplate, sidebarViewMode, t],
	);

	const changeSelection = useMutableCallback((dir) => {
		let nextSelectedElement = null;

		if (dir === 'up') {
			nextSelectedElement = (selectedElement.current?.parentElement?.previousSibling as HTMLElement).querySelector('a');
		} else {
			nextSelectedElement = (selectedElement.current?.parentElement?.nextSibling as HTMLElement).querySelector('a');
		}

		if (nextSelectedElement) {
			toggleSelectionState(nextSelectedElement, selectedElement.current || undefined, cursorRef?.current || undefined);
			return nextSelectedElement;
		}
		return selectedElement.current;
	});

	const resetCursor = useMutableCallback(() => {
		itemIndexRef.current = 0;
		listRef.current?.scrollToIndex({ index: itemIndexRef.current });

		selectedElement.current = boxRef.current?.querySelector('a.rcx-sidebar-item');

		if (selectedElement.current) {
			toggleSelectionState(selectedElement.current, undefined, cursorRef?.current || undefined);
		}
	});

	usePreventDefault(boxRef);

	useEffect(() => {
		resetCursor();
	});

	useEffect(() => {
		resetCursor();
	}, [filterText, resetCursor]);

	useEffect(() => {
		if (!cursorRef?.current) {
			return;
		}
		const unsubscribe = tinykeys(cursorRef?.current, {
			Escape: (event) => {
				event.preventDefault();
				setFilterValue((value) => {
					if (!value) {
						onClose();
					}
					resetCursor();
					return '';
				});
			},
			Tab: onClose,
			ArrowUp: () => {
				const currentElement = changeSelection('up');
				itemIndexRef.current = Math.max(itemIndexRef.current - 1, 0);
				listRef.current?.scrollToIndex({ index: itemIndexRef.current });
				selectedElement.current = currentElement;
			},
			ArrowDown: () => {
				const currentElement = changeSelection('down');
				itemIndexRef.current = Math.min(itemIndexRef.current + 1, items.length + 1);
				listRef.current?.scrollToIndex({ index: itemIndexRef.current });
				selectedElement.current = currentElement;
			},
			Enter: () => {
				if (selectedElement.current) {
					selectedElement.current.click();
				}
			},
		});
		return (): void => {
			unsubscribe();
		};
	}, [cursorRef, changeSelection, items.length, onClose, resetCursor, setFilterValue]);

	const handleClick: MouseEventHandler<HTMLElement> = (e): void => {
		if (e.target instanceof Element && [e.target.tagName, e.target.parentElement?.tagName].includes('BUTTON')) {
			return;
		}
		return onClose();
	};

	return (
		<Box
			position='absolute'
			rcx-sidebar
			h='full'
			display='flex'
			flexDirection='column'
			zIndex={99}
			w='full'
			className={css`
				left: 0;
				top: 0;
			`}
			ref={ref}
		>
			<Sidebar.TopBar.Section {...({ role: 'search', flexShrink: 0 } as any)} is='form'>
				<TextInput
					aria-owns={listId}
					data-qa='sidebar-search-input'
					ref={autofocus}
					{...filter}
					placeholder={placeholder}
					addon={<Icon name='cross' size='x20' onClick={onClose} />}
				/>
			</Sidebar.TopBar.Section>
			<Box
				ref={boxRef}
				aria-expanded='true'
				role='listbox'
				id={listId}
				tabIndex={-1}
				flexShrink={1}
				h='full'
				w='full'
				data-qa='sidebar-search-result'
				aria-busy={isLoading}
				onClick={handleClick}
			>
				<Virtuoso
					style={{ height: '100%', width: '100%' }}
					totalCount={items.length}
					data={items}
					components={{ Scroller: ScrollerWithCustomProps }}
					itemContent={(_, data): ReactElement => <Row data={itemData} item={data} />}
					ref={listRef}
				/>
			</Box>
		</Box>
	);
});

export default SearchList;
