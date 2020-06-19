import React from 'react';

import { ModalContext } from '../contexts/ModalContext';
import { modal } from '../../app/ui-utils/client/lib/modal';

function ModalProvider({ children }) {
	return <ModalContext.Provider children={children} value={modal} />;
}

export default ModalProvider;
