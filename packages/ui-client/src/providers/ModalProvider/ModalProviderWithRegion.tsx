import type { ReactNode } from 'react';
import { useState } from 'react';

import ModalProvider from './ModalProvider';
import ModalRegion from '../../components/Modal/ModalRegion';

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
