import { Modal } from '@rocket.chat/fuselage';
import React, { useState, useMemo, memo, FC, ComponentProps, ReactNode } from 'react';

import { modal } from '../../app/ui-utils/client/lib/modal';
import ModalPortal from '../components/ModalPortal';
import { ModalContext } from '../contexts/ModalContext';
import { useImperativeModal } from '../views/hooks/useImperativeModal';

const ModalProvider: FC = ({ children }) => {
	const [currentModal, setCurrentModal] = useState<ReactNode>(null);

	const contextValue = useMemo<ComponentProps<typeof ModalContext.Provider>['value']>(
		() =>
			Object.assign(modal, {
				setModal: setCurrentModal,
			}),
		[],
	);

	useImperativeModal(setCurrentModal);

	return (
		<ModalContext.Provider value={contextValue}>
			{children}
			{currentModal && (
				<ModalPortal>
					<Modal.Backdrop zIndex={9999}>{currentModal}</Modal.Backdrop>
				</ModalPortal>
			)}
		</ModalContext.Provider>
	);
};

export default memo<typeof ModalProvider>(ModalProvider);
