import { ModalContext } from '@rocket.chat/ui-contexts';
import React, { useState, useMemo, memo, ReactNode, useCallback, ReactElement } from 'react';

import { modal } from '../../app/ui-utils/client/lib/modal';
import ModalBackdrop from '../components/modal/ModalBackdrop';
import ModalPortal from '../components/modal/ModalPortal';
import { useImperativeModal } from '../views/hooks/useImperativeModal';

type ModalProviderProps = {
	children?: ReactNode;
};

const ModalProvider = ({ children }: ModalProviderProps): ReactElement => {
	const [currentModal, setCurrentModal] = useState<ReactNode>(null);

	const contextValue = useMemo(
		() =>
			Object.assign(modal, {
				setModal: setCurrentModal,
			}),
		[],
	);

	useImperativeModal(setCurrentModal);

	const handleDismiss = useCallback(() => setCurrentModal(null), [setCurrentModal]);

	return (
		<ModalContext.Provider value={contextValue}>
			{children}
			{currentModal && (
				<ModalPortal>
					<ModalBackdrop onDismiss={handleDismiss}>{currentModal}</ModalBackdrop>
				</ModalPortal>
			)}
		</ModalContext.Provider>
	);
};

export default memo<typeof ModalProvider>(ModalProvider);
