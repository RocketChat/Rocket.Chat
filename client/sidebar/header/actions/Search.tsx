import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback, useOutsideClick } from '@rocket.chat/fuselage-hooks';
import React, { useState, useEffect, useRef, ReactElement, ComponentProps } from 'react';
import tinykeys from 'tinykeys';

import SearchList from '../../search/SearchList';

type SearchProps = Omit<ComponentProps<typeof Sidebar.TopBar.Action>, 'icon'>;

const Search = (props: SearchProps): ReactElement => {
	const [searchOpen, setSearchOpen] = useState(false);

	const ref = useRef<HTMLElement>(null);
	const handleCloseSearch = useMutableCallback(() => {
		setSearchOpen(false);
	});

	useOutsideClick([ref], handleCloseSearch);

	const openSearch = useMutableCallback(() => {
		setSearchOpen(true);
	});

	useEffect(() => {
		const unsubscribe = tinykeys(window, {
			'$mod+K': (event) => {
				event.preventDefault();
				openSearch();
			},
			'$mod+P': (event) => {
				event.preventDefault();
				openSearch();
			},
		});

		return (): void => {
			unsubscribe();
		};
	}, [openSearch]);

	return (
		<>
			<Sidebar.TopBar.Action icon='magnifier' onClick={openSearch} {...props} />
			{searchOpen && <SearchList ref={ref} onClose={handleCloseSearch} />}
		</>
	);
};

export default Search;
