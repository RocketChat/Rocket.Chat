import React from 'react';
import { Sidebar } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';

import { toolbarSearch } from '../../../../app/ui-sidenav/client/sidebarHeader';

const Search = (props) => {
	const handleSearch = useMutableCallback(() => toolbarSearch.show(false));

	return <Sidebar.TopBar.Action {...props} icon='magnifier' onClick={handleSearch}/>;
};

export default Search;
