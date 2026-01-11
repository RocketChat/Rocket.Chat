import type { ReactNode, ReactElement } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';

type MessageHistoryModalContextType = {
	openMessageId: string | null;
	openModal: (messageId: string) => void;
	closeModal: () => void;
};

const MessageHistoryModalContext = createContext<MessageHistoryModalContextType | undefined>(undefined);

export const MessageHistoryModalProvider = ({ children }: { children: ReactNode }): ReactElement => {
	const [openMessageId, setOpenMessageId] = useState<string | null>(null);

	const openModal = useCallback((messageId: string) => {
		setOpenMessageId(messageId);
	}, []);

	const closeModal = useCallback(() => {
		setOpenMessageId(null);
	}, []);

	return (
		<MessageHistoryModalContext.Provider value={{ openMessageId, openModal, closeModal }}>
			{children}
		</MessageHistoryModalContext.Provider>
	);
};



export const useMessageHistoryModal = (): MessageHistoryModalContextType => {
	const context = useContext(MessageHistoryModalContext);
	if (!context) {
		throw new Error('useMessageHistoryModal must be used within MessageHistoryModalProvider');
	}
	return context;
};
