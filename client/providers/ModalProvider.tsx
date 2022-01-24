import { Modal } from '@rocket.chat/fuselage';
import React, { useState, useMemo, memo, FC, ComponentProps, ReactNode, useEffect, useCallback } from 'react';

import { modal } from '../../app/ui-utils/client/lib/modal';
import ModalPortal from '../components/ModalPortal';
import { ModalContext } from '../contexts/ModalContext';
import { useImperativeModal } from '../views/hooks/useImperativeModal';

const BACKDROP_ID = 'rc-modal-backdrop';

const getBackdrop = (): HTMLElement | null => document.getElementById(BACKDROP_ID);

const ModalProvider: FC = ({ children }) => {
	const [currentModal, setCurrentModal] = useState<ReactNode>(null);

	const contextValue = useMemo<ComponentProps<typeof ModalContext.Provider>['value']>(
		() =>
			Object.assign(modal, {
				setModal: setCurrentModal,
			}),
		[],
	);

	const closeModalOnBackdropClick = useCallback((e) => {
		const backdrop = getBackdrop();

		// checking for parent since myNode.contains(myNode) is true
		if (!backdrop || backdrop.contains(e.target.parentElement)) {
			return;
		}

		e.stopPropagation();
		setCurrentModal(null);
	}, []);

	useEffect(() => {
		const closeOnEsc = (e: KeyboardEvent): void => {
			if (e.key !== 'Escape' || !currentModal) {
				return;
			}
			e.stopPropagation();
			setCurrentModal(null);
		};

		window.addEventListener('keyup', closeOnEsc);

		return (): void => {
			window.removeEventListener('keyup', closeOnEsc);
		};
	}, [currentModal]);

	useImperativeModal(setCurrentModal);

	return (
		<ModalContext.Provider value={contextValue}>
			{children}
			{currentModal && (
				<ModalPortal>
					<Modal.Backdrop zIndex={9999} id={BACKDROP_ID} onClick={closeModalOnBackdropClick}>
						{currentModal}
					</Modal.Backdrop>
				</ModalPortal>
			)}
		</ModalContext.Provider>
	);
};

export default memo<typeof ModalProvider>(ModalProvider);
