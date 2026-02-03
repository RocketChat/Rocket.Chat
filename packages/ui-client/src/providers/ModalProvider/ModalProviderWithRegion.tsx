import type { ReactNode } from 'react';
import { useRef } from 'react';

import ModalProvider from './ModalProvider';
import ModalRegion from '../../components/Modal/ModalRegion';

const ModalProviderWithRegion = ({ children }: { children?: ReactNode }) => {
	const region = useRef(Symbol()).current;

	return (
		<ModalProvider region={region}>
			<ModalRegion />
			{children}
		</ModalProvider>
	);
};

export default ModalProviderWithRegion;