import type { ReactNode } from 'react';
import React, { useState } from 'react';

import ModalRegion from '../views/modal/ModalRegion';
import ModalProvider from './ModalProvider';

const ModalProviderWithRegion = ({ children }: { children: ReactNode }) => {
	const [region] = useState(() => Symbol());

	return (
		<ModalProvider region={region}>
			<ModalRegion />
			{children}
		</ModalProvider>
	);
};

export default ModalProviderWithRegion;
