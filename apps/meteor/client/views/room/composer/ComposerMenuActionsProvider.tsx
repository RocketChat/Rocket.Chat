import { useSetModal } from '@rocket.chat/ui-contexts';
import type { ReactNode } from 'react';
import { useMemo } from 'react';

import type { ComposerMenuActions } from './ComposerMenuActionsContext';
import { ComposerMenuActionsContext } from './ComposerMenuActionsContext';
import CreateDiscussion from '../../../components/CreateDiscussion';
import { TimestampPickerModal } from '../../../components/message/toolbar/items/actions/Timestamp/TimestampPicker/TimestampPickerModal';
import ShareLocationModal from '../ShareLocation/ShareLocationModal';
import { useChat } from '../contexts/ChatContext';
import AddWebdavAccountModal from '../webdav/AddWebdavAccountModal';
import WebdavFilePickerModal from '../webdav/WebdavFilePickerModal';

type ComposerMenuActionsProviderProps = {
	children?: ReactNode;
};

/** Carries out what the composer's action menu asks for: the modals it opens and the files it uploads */
const ComposerMenuActionsProvider = ({ children }: ComposerMenuActionsProviderProps) => {
	const setModal = useSetModal();
	const chat = useChat();

	const value = useMemo((): ComposerMenuActions => {
		const close = () => setModal(null);

		return {
			addWebdavAccount: () => setModal(<AddWebdavAccountModal onClose={close} onConfirm={close} />),
			pickWebdavFile: (account) =>
				setModal(
					<WebdavFilePickerModal account={account} onUpload={async (file) => chat?.flows.uploadFiles({ files: [file] })} onClose={close} />,
				),
			createDiscussion: (room) =>
				setModal(<CreateDiscussion onClose={close} defaultParentRoom={room.prid || room._id} encryptedParentRoom={room.encrypted} />),
			shareLocation: (room, tmid) => setModal(<ShareLocationModal rid={room._id} tmid={tmid} onClose={close} />),
			insertTimestamp: (composer) => setModal(<TimestampPickerModal onClose={close} composer={composer} />),
		};
	}, [chat, setModal]);

	return <ComposerMenuActionsContext.Provider value={value}>{children}</ComposerMenuActionsContext.Provider>;
};

export default ComposerMenuActionsProvider;
