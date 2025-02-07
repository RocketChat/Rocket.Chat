import { Sidebar } from '@rocket.chat/fuselage';
import { useEffectEvent, useOutsideClick } from '@rocket.chat/fuselage-hooks';
import type { HTMLAttributes } from 'react';
import { useState, useEffect, useRef } from 'react';
import tinykeys from 'tinykeys';

import SearchList from '../../search/SearchList';

type SearchProps = Omit<HTMLAttributes<HTMLElement>, 'is'>;

const Search = (props: SearchProps) => {
	const [searchOpen, setSearchOpen] = useState(false);

	const ref = useRef<HTMLElement>(null);
	const handleCloseSearch = useEffectEvent(() => {
		setSearchOpen(false);
	});

	useOutsideClick([ref], handleCloseSearch);

	const openSearch = useEffectEvent(() => {
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
