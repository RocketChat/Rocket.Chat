import type { IWebdavAccountIntegration } from '@rocket.chat/core-typings';
import { useSetting, useSetModal } from '@rocket.chat/ui-contexts';
import React from 'react';

import { WebdavAccounts } from '../../../../../../../app/models/client';
import { useReactiveValue } from '../../../../../../hooks/useReactiveValue';
import { useChat } from '../../../../contexts/ChatContext';
import AddWebdavAccountModal from '../../../../webdav/AddWebdavAccountModal';
import WebdavFilePickerModal from '../../../../webdav/WebdavFilePickerModal';

const getWebdavAccounts = (): IWebdavAccountIntegration[] => WebdavAccounts.find().fetch();

export const useWebdavAction = () => {
	const setModal = useSetModal();
	const webDavEnabled = useSetting('Webdav_Integration_Enabled');
	const webDavAccounts = useReactiveValue(getWebdavAccounts);

	const chat = useChat();

	const handleUpload = async (file: File, description?: string) =>
		chat?.uploads.send(file, {
			description,
		});

	const handleAddWebdav = () => setModal(<AddWebdavAccountModal onClose={() => setModal(null)} onConfirm={() => setModal(null)} />);

	const handleOpenWebdav = (account: IWebdavAccountIntegration) =>
		setModal(<WebdavFilePickerModal account={account} onUpload={handleUpload} onClose={() => setModal(null)} />);

	return { handleAddWebdav, handleOpenWebdav, webDavAccounts, webDavEnabled };
};
