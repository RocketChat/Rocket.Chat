import React, { useState, useEffect } from 'react';
import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import tinykeys from 'tinykeys';

import { useOutsideClick } from '../../../hooks/useOutsideClick';
import SearchList from '../../search/SearchList';

const Search = (props) => {
	const [searchOpen, setSearchOpen] = useState(false);

	// const viewRef = useRef();

	const handleCloseSearch = useMutableCallback(() => {
		setSearchOpen(false);
		// viewRef.current && Blaze.remove(viewRef.current);
	});

	const openSearch = useMutableCallback(() => {
		setSearchOpen(true);
	});

	const ref = useOutsideClick(handleCloseSearch);


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

	return <>
		<Sidebar.TopBar.Action icon='magnifier' onClick={openSearch} {...props}/>
		{searchOpen && <SearchList ref={ref} onClose={handleCloseSearch}/>}
	</>;
};

export default Search;
