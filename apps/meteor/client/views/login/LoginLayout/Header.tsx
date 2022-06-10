import React, { ReactElement } from 'react';

import { useAssetPath } from './useAssetPath';

const Header = (): ReactElement => {
	const logoUrl = useAssetPath('Assets_logo');

	return (
		<header>
			<a className='logo' href='/'>
				<img src={logoUrl} />
			</a>
		</header>
	);
};

export default Header;
