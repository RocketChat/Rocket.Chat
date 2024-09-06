import { css } from '@rocket.chat/css-in-js';
import { Box, Icon, TextInput, Palette, Sidebar } from '@rocket.chat/fuselage';
import { useMergedRefs, useOutsideClick } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useUser } from '@rocket.chat/ui-contexts';
import React, { useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import tinykeys from 'tinykeys';

import SearchList from './SearchList';
import CreateRoom from './actions/CreateRoom';
import Sort from './actions/Sort';

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

const SearchSection = () => {
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

	const inputRef = useRef<HTMLInputElement>(null);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const mergedRefs = useMergedRefs(filterRef, inputRef);

	const handleEscSearch = useCallback(() => {
		resetField('filterText');
		inputRef.current?.blur();
	}, [resetField]);

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

	return (
		<Box className={['rcx-sidebar', isDirty && wrapperStyle]} ref={wrapperRef} role='search'>
			<Box
				pi={16}
				h='x44'
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
			{isDirty && <SearchList filterText={filterText} onEscSearch={handleEscSearch} />}
		</Box>
	);
};

export default SearchSection;
