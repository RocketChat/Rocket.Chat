import { createContext } from 'react';

export type AttachmentEncryptionContextValue = {
	isMessageEncrypted: boolean;
};

export const AttachmentEncryptionContext = createContext<AttachmentEncryptionContextValue>({
	isMessageEncrypted: false,
});
