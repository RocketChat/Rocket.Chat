import type { ReactElement } from 'react';
import React from 'react';

import { useAssetPath } from './useAssetPath';

const LoginLayoutHeader = (): ReactElement => {
	const logoUrl = useAssetPath('Assets_logo');

	return (
		<header>
			<a className='logo' href='/'>
				<img src={logoUrl} />
			</a>
		</header>
	);
};

export default LoginLayoutHeader;
