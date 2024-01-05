import type { IWebdavAccountIntegration } from '@rocket.chat/core-typings';
import { useTranslation, useSetting, useSetModal } from '@rocket.chat/ui-contexts';
import React from 'react';

import { WebdavAccounts } from '../../../../../../../app/models/client';
import { useReactiveValue } from '../../../../../../hooks/useReactiveValue';
import { useChat } from '../../../../contexts/ChatContext';
import AddWebdavAccountModal from '../../../../webdav/AddWebdavAccountModal';
import WebdavFilePickerModal from '../../../../webdav/WebdavFilePickerModal';
import type { ToolbarAction } from './ToolbarAction';

const getWebdavAccounts = (): IWebdavAccountIntegration[] => WebdavAccounts.find().fetch();

export const useWebdavActions = (): Array<ToolbarAction> => {
	const t = useTranslation();
	const setModal = useSetModal();
	const webDavAccounts = useReactiveValue(getWebdavAccounts);

	const webDavEnabled = useSetting('Webdav_Integration_Enabled');

	const handleCreateWebDav = () => setModal(<AddWebdavAccountModal onClose={() => setModal(null)} onConfirm={() => setModal(null)} />);

	const chat = useChat();

	const handleUpload = async (file: File, description?: string) =>
		chat?.uploads.send(file, {
			description,
		});

	const handleOpenWebdav = (account: IWebdavAccountIntegration) =>
		setModal(<WebdavFilePickerModal account={account} onUpload={handleUpload} onClose={() => setModal(null)} />);

	return [
		{
			id: 'webdav-add',
			title: !webDavEnabled ? t('WebDAV_Integration_Not_Allowed') : undefined,
			disabled: !webDavEnabled,
			onClick: handleCreateWebDav,
			icon: 'cloud-plus',
			label: t('Add_Server'),
		},
		...(webDavEnabled && webDavAccounts.length > 0
			? webDavAccounts.map((account) => ({
					id: account._id,
					disabled: false,
					onClick: () => handleOpenWebdav(account),
					icon: 'cloud-plus' as const,
					label: account.name,
			  }))
			: []),
	];
};
