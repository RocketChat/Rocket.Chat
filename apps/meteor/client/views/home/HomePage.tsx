import React, { ReactElement } from 'react';

import CustomHomePage from './CustomHomePage';

// TODO: use a setting to determine if the user has a custom home page
const custom = true;

const HomePage = (): ReactElement => {
	if (custom) {
		return <CustomHomePage />;
	}

	return <></>; // TODO: render a default home page
};

export default HomePage;
