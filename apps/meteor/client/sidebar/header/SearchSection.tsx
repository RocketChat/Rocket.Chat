import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, TextInput, Palette, Sidebar } from '@rocket.chat/fuselage';
import { useMergedRefs, useOutsideClick } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useUserPreference, useSetting, useUser } from '@rocket.chat/ui-contexts';
import type { MouseEventHandler, ReactElement } from 'react';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Virtuoso } from 'react-virtuoso';
import tinykeys from 'tinykeys';

import { VirtuosoScrollbars } from '../../components/CustomScrollbars';
import RoomListWrapper from '../RoomList/RoomListWrapper';
import { useAvatarTemplate } from '../hooks/useAvatarTemplate';
import { usePreventDefault } from '../hooks/usePreventDefault';
import { useTemplateByViewMode } from '../hooks/useTemplateByViewMode';
import Row from '../search/Row';
import CreateRoom from './actions/CreateRoom';
import Sort from './actions/Sort';
import { useSearchItems } from './hooks/useSearchItems';

const wrapperStyle = css`
	position: absolute;
	height: 100%;
	width: 100%;
	display: flex;
	flex-direction: column;
	z-index: 99;
	top: 0;
	left: 0;
	background-color: ${Palette.surface['surface-sidebar']};
`;

export const SearchSection = () => {
	const t = useTranslation();
	const user = useUser();

	const {
		formState: { isDirty },
		register,
		watch,
		resetField,
		setFocus,
	} = useForm({ defaultValues: { filterText: '' } });
	const { filterText } = watch();
	const { ref: filterRef, ...rest } = register('filterText');

	const boxRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const mergedRefs = useMergedRefs(filterRef, inputRef);

	const { data: items = [], isLoading } = useSearchItems(filterText);

	const sidebarViewMode = useUserPreference('sidebarViewMode');
	const useRealName = useSetting('UI_Use_Real_Name');

	const sideBarItemTemplate = useTemplateByViewMode();
	const avatarTemplate = useAvatarTemplate();

	const extended = sidebarViewMode === 'extended';

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

	const handleEscSearch = useCallback(() => {
		resetField('filterText');
		inputRef.current?.blur();
	}, [resetField]);

	usePreventDefault(boxRef);
	useOutsideClick([wrapperRef], handleEscSearch);

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
	}, [handleEscSearch, setFocus]);

	const handleClick: MouseEventHandler<HTMLElement> = (e): void => {
		if (e.target instanceof Element && [e.target.tagName, e.target.parentElement?.tagName].includes('BUTTON')) {
			return;
		}
		return handleEscSearch();
	};

	return (
		<Box className={['rcx-sidebar', isDirty && wrapperStyle]} ref={wrapperRef} role='search'>
			<Box
				pi={16}
				pb={8}
				display='flex'
				alignItems='center'
				className={css`
					gap: 8px;
				`}
			>
				<TextInput
					placeholder={t('Search')}
					{...rest}
					ref={mergedRefs}
					role='searchbox'
					small
					addon={<Icon name={isDirty ? 'cross' : 'magnifier'} size='x20' onClick={handleEscSearch} />}
				/>

				{user && !isDirty && (
					<>
						<Sort />
						<CreateRoom />
					</>
				)}
			</Box>
			<Sidebar.Divider />
			{isDirty && (
				<Box
					ref={boxRef}
					role='listbox'
					// id={listId}
					tabIndex={-1}
					flexShrink={1}
					h='full'
					w='full'
					pbs={8}
					aria-live='polite'
					aria-atomic='true'
					aria-busy={isLoading}
					onClick={handleClick}
				>
					<Virtuoso
						style={{ height: '100%', width: '100%' }}
						totalCount={items.length}
						data={items}
						components={{ List: RoomListWrapper, Scroller: VirtuosoScrollbars }}
						computeItemKey={(_, room) => room._id}
						itemContent={(_, data): ReactElement => <Row data={itemData} item={data} />}
					/>
				</Box>
			)}
		</Box>
	);
};
