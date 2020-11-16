import { Modal } from '@rocket.chat/fuselage';
import React, { useState, useMemo, memo } from 'react';

import { modal } from '../../app/ui-utils/client/lib/modal';
import ModalPortal from '../components/ModalPortal';
import { ModalContext } from '../contexts/ModalContext';

function ModalProvider({ children }) {
	const [currentModal, setCurrentModal] = useState(null);

	const contextValue = useMemo(() => Object.assign(modal, {
		setModal: setCurrentModal,
	}), []);

	return <ModalContext.Provider value={contextValue}>
		{children}
		{currentModal && <ModalPortal>
			<Modal.Backdrop zIndex={9999}>
				{currentModal}
			</Modal.Backdrop>
		</ModalPortal>}
	</ModalContext.Provider>;
}

export default memo(ModalProvider);
