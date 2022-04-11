import React, { ReactElement, ReactNode } from 'react';

import Footer from './Footer';
import Header from './Header';
import { useAssetPath } from './useAssetPath';

type LoginLayoutProps = {
	children?: ReactNode;
};

const LoginLayout = ({ children }: LoginLayoutProps): ReactElement => {
	const backgroundUrl = useAssetPath('Assets_background');

	return (
		<section
			className='rc-old full-page color-tertiary-font-color'
			style={backgroundUrl ? { backgroundImage: `url('${encodeURI(backgroundUrl)}')` } : undefined}
		>
			<div className='wrapper'>
				<Header />
				{children}
				<Footer />
			</div>
		</section>
	);
};

export default LoginLayout;
