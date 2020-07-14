import { Modal } from '@rocket.chat/fuselage';
import React, { useState, useMemo, memo } from 'react';

import { modal } from '../../app/ui-utils/client/lib/modal';
import ModalPortal from '../components/ModalPortal';
import { ModalContext } from '../contexts/ModalContext';


const style = { zIndex: 999 };
function ModalProvider({ children }) {
	const [currentModal, setCurrentModal] = useState(null);

	const contextValue = useMemo(() => Object.assign(modal, {
		setModal: setCurrentModal,
	}), []);

	return <ModalContext.Provider value={contextValue}>
		{children}
		{currentModal && <ModalPortal>
			<Modal.Backdrop style={style}>
				{currentModal}
			</Modal.Backdrop>
		</ModalPortal>}
	</ModalContext.Provider>;
}

export default memo(ModalProvider);
