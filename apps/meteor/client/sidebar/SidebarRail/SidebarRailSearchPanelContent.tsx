import { useFocusManager } from '@react-aria/focus';
import { Box, Icon, IconButton, SidepanelHeader, TextInput } from '@rocket.chat/fuselage';
import { VirtualizedScrollbars } from '@rocket.chat/ui-client';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';
import tinykeys from 'tinykeys';

import { useSidebarRailStore } from './useSidebarRailStore';
import ResultsLiveRegion from '../../components/ResultsLiveRegion';
import NavBarSearchItemSkeleton from '../../navbar/NavBarSearch/NavBarSearchItemSkeleton';
import NavBarSearchNoResults from '../../navbar/NavBarSearch/NavBarSearchNoResults';
import NavBarSearchRow from '../../navbar/NavBarSearch/NavBarSearchRow';
import { getShortcutLabel } from '../../navbar/NavBarSearch/getShortcutLabel';
import { useSearchItems } from '../../navbar/NavBarSearch/hooks/useSearchItems';
import { isOption } from '../../navbar/NavBarSearch/hooks/useSearchNavigation';

const SidebarRailSearchPanelContent = () => {
	const { t } = useTranslation();
	const focusManager = useFocusManager();
	const inputRef = useRef<HTMLInputElement>(null);

	const searchText = useSidebarRailStore((state) => state.searchText);
	const setSearchText = useSidebarRailStore((state) => state.setSearchText);

	const { items, isLoading } = useSearchItems(searchText);

	const placeholder = [t('Search_rooms'), getShortcutLabel()].filter(Boolean).join(' ');

	useEffect(() => {
		inputRef.current?.focus();

		const focusInput = (event: KeyboardEvent) => {
			event.preventDefault();
			inputRef.current?.focus();
		};

		return tinykeys(window, {
			'$mod+K': focusInput,
			'$mod+P': focusInput,
		});
	}, []);

	const handleClear = () => {
		setSearchText('');
		inputRef.current?.focus();
	};

	const handleInputKeyDown = (event: ReactKeyboardEvent) => {
		if (event.key === 'Escape') {
			event.preventDefault();
			setSearchText('');
		}

		if (event.code === 'ArrowDown') {
			event.preventDefault();
			focusManager?.focusNext({ accept: isOption });
		}
	};

	const handleListKeyDown = (event: ReactKeyboardEvent) => {
		if (event.code === 'ArrowUp') {
			event.preventDefault();
			focusManager?.focusPrevious({ wrap: true, accept: isOption });
		}

		if (event.code === 'ArrowDown') {
			event.preventDefault();
			focusManager?.focusNext({ wrap: true, accept: isOption });
		}
	};

	return (
		<>
			<SidepanelHeader>
				<TextInput
					ref={inputRef}
					value={searchText}
					onChange={(event) => setSearchText(event.currentTarget.value)}
					onKeyDown={handleInputKeyDown}
					autoComplete='off'
					placeholder={placeholder}
					aria-label={t('Search_rooms')}
					aria-keyshortcuts='Control+K Meta+K Control+P Meta+P'
					small
					endAddon={
						searchText ? (
							<IconButton mini icon='cross' aria-label={t('Clear')} onClick={handleClear} />
						) : (
							<Icon name='magnifier' size='x20' aria-hidden />
						)
					}
				/>
			</SidepanelHeader>
			<ResultsLiveRegion shouldAnnounce={!isLoading} itemCount={items.length} isLoading={isLoading} />
			{items.length === 0 && !isLoading && <NavBarSearchNoResults />}
			{items.length > 0 && (
				<Box color='titles-labels' fontScale='c1' fontWeight='bold' paddingInline={16} paddingBlock={8} role='presentation' aria-hidden>
					{searchText ? t('Results') : t('Recent')}
				</Box>
			)}
			<Box
				role='listbox'
				aria-label={t('Results')}
				aria-busy={isLoading}
				flexGrow={1}
				flexShrink={1}
				minHeight={0}
				onKeyDown={handleListKeyDown}
			>
				<VirtualizedScrollbars>
					<Virtuoso data={items} computeItemKey={(_, item) => item._id} itemContent={(_, item) => <NavBarSearchRow room={item} />} />
				</VirtualizedScrollbars>
			</Box>
			{isLoading && Array.from({ length: 4 }, (_, index) => <NavBarSearchItemSkeleton key={`skeleton-${index}`} />)}
		</>
	);
};

export default SidebarRailSearchPanelContent;
