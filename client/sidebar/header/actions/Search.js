import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback, useOutsideClick } from '@rocket.chat/fuselage-hooks';
import React, { useState, useEffect, useRef } from 'react';
import tinykeys from 'tinykeys';

import SearchList from '../../search/SearchList';

const Search = (props) => {
	const [searchOpen, setSearchOpen] = useState(false);

	const ref = useRef();

	const handleCloseSearch = useMutableCallback(() => {
		setSearchOpen(false);
		// viewRef.current && Blaze.remove(viewRef.current);
	});

	const openSearch = useMutableCallback(() => {
		setSearchOpen(true);
	});

	useOutsideClick([ref], handleCloseSearch);

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
		return () => {
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
