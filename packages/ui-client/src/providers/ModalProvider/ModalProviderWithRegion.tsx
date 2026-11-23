import type { ReactNode } from 'react';
import { useState } from 'react';

import ModalProvider from './ModalProvider.js';
import ModalRegion from '../../components/Modal/ModalRegion.js';

export type ModalProviderWithRegionProps = { children?: ReactNode };

const ModalProviderWithRegion = ({ children }: ModalProviderWithRegionProps) => {
	const [region] = useState(() => Symbol());

	return (
		<ModalProvider region={region}>
			<ModalRegion />
			{children}
		</ModalProvider>
	);
};

export default ModalProviderWithRegion;
