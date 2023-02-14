import { ModalContext } from '@rocket.chat/ui-contexts';
import type { ReactNode, ReactElement } from 'react';
import React, { useState, useMemo, memo } from 'react';

import { modal } from '../../app/ui-utils/client/lib/modal';
import { useImperativeModal } from '../views/hooks/useImperativeModal';

type ModalProviderProps = {
	children?: ReactNode;
};

const ModalProvider = ({ children }: ModalProviderProps): ReactElement => {
	const [currentModal, setCurrentModal] = useState<ReactNode>(null);

	const contextValue = useMemo(
		() => ({
			modal: Object.assign(modal, {
				setModal: setCurrentModal,
			}),
			currentModal,
		}),
		[currentModal],
	);

	useImperativeModal(setCurrentModal);

	return <ModalContext.Provider value={contextValue} children={children} />;
};

export default memo<typeof ModalProvider>(ModalProvider);
