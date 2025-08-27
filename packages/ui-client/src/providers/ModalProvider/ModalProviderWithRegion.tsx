import type { ReactNode } from 'react';
import { useState } from 'react';

import ModalProvider from './ModalProvider';
import ModalRegion from '../../components/Modal/ModalRegion';

const ModalProviderWithRegion = ({ children }: { children?: ReactNode }) => {
	const [region] = useState(() => Symbol());

	return (
		<ModalProvider region={region}>
			<ModalRegion />
			{children}
		</ModalProvider>
	);
};

export default ModalProviderWithRegion;
